"""Build the matched resting arms for the Movement Lab mesh export."""
from math import cos, pi, sin
from mathutils import Vector

LIGHT = Vector((-.43,.61,.67)).normalized()


def build_arms(buffer, male):
    skin = (.93,.61,.43) if male else (.95,.65,.46)

    def tube(sections, across, count=24):
        centers = [Vector(p) for p,_,_ in sections]
        rings = []
        for i, (center, wide, thick) in enumerate(sections):
            tangent = (centers[min(i+1,len(centers)-1)]-centers[max(i-1,0)]).normalized()
            side = (across - tangent*across.dot(tangent)).normalized()
            normal = tangent.cross(side).normalized()
            ring = []
            for j in range(count):
                angle = 2*pi*j/count
                a,b = cos(angle),sin(angle)
                p = centers[i]+side*(wide*a)+normal*(thick*b)
                light = max(0,(side*a+normal*b).dot(LIGHT))
                shade = .76+.24*light
                ring.append((*p,*(c*shade for c in skin)))
            rings.append(ring)
        for start,end in zip(rings,rings[1:]):
            for j in range(count):
                k = (j+1)%count
                for point in (start[j],end[j],start[k],start[k],end[j],end[k]):
                    buffer.extend(point)

    for sign in (-1,1):
        lateral = Vector((sign,0,0))
        # Keep the upper arm inside the existing sleeve and emerge at its cuff.
        # These centers define the shoulder, elbow and wrist in export coordinates.
        y = (.044 if sign>0 else -.039) if male else (.014 if sign>0 else .023)
        shoulder = Vector((sign*.160,y,.812))
        elbow = Vector((sign*(.236 if male else .224),y-.012,.666 if male else .676))
        wrist = Vector((sign*(.269 if male else .251),y+.047,.555 if male else .563))
        waistward = Vector((-sign*.75,.66,0)).normalized()
        wide,thick = ((.036,.039) if male else (.029,.033))
        rows = [
            (shoulder,0,0),
            (shoulder.lerp(elbow,.35),wide*.87,thick),
            (shoulder.lerp(elbow,.66),wide*.96,thick*1.04),
            (elbow,wide,thick),
            (elbow.lerp(wrist,.26),wide*1.03,thick*.99),
            (elbow.lerp(wrist,.58),wide*.77,thick*.81),
            (wrist,wide*.59,thick*.65),
            (wrist+Vector((sign*.004,.003,-.017)),wide*.47,thick*.51),
            (wrist+Vector((sign*.007,.005,-.023)),0,0),
        ]
        tube(rows,lateral)

        palm = wrist+Vector((sign*.009,.009,-.030))
        span = .036 if male else .030
        thickness = .021 if male else .018
        down = Vector((sign*.16,.10,-.98))
        tube([
            (wrist+Vector((0,0,.006)),0,0),
            (wrist,span*.72,thickness*.82),
            (palm-down*.014,span*.93,thickness),
            (palm,span,thickness),
            (palm+down*.016,span*.95,thickness*.84),
            (palm+down*.026,span*.69,thickness*.58),
            (palm+down*.030,0,0),
        ],waistward)

        for i,(length,radius) in enumerate(((.044,.0092),(.049,.0094),(.046,.0087),(.037,.0076))):
            offset = (i-1.5)*span*.52
            root = palm+waistward*offset+down*.015
            direction = down+waistward*(i-1.5)*.09
            end = root+direction*length-lateral*.012
            bulb = radius*(1 if male else .86)
            tube([
                (root,bulb,bulb),
                (root+direction*length*.36,bulb,bulb*.91),
                (root+direction*length*.68-lateral*.004,bulb*.87,bulb*.83),
                (end+Vector((0,0,.003)),bulb*.62,bulb*.61),
                (end,0,0),
            ],waistward,16)

        thumb = palm+Vector((-sign*.014,.020,.009))
        tip = thumb+Vector((-sign*.017,.015,-.029))
        radius = .0125 if male else .0105
        tube([
            (thumb,0,0),
            (thumb.lerp(tip,.19),radius,radius*.96),
            (thumb.lerp(tip,.51),radius*.91,radius*.86),
            (thumb.lerp(tip,.85),radius*.68,radius*.62),
            (tip,0,0),
        ],Vector((0,1,0)),18)
