from math import acos, atan2, cos, exp, pi, sin, sqrt
from mathutils import Vector
from mathutils.bvhtree import BVHTree


def fabric(name, floats, male):
    """Retint the existing tailored pieces in exported space."""
    shirt = name.startswith(('Shirt torso', 'Shirt sleeve', 'Shirt collar flap', 'Sleeve cuff'))
    denim = name.startswith(('Overall bib', 'Crossed back strap', 'Front suspender'))
    if not (shirt or denim):
        return floats

    def shade(v):
        x, y, z, r, g, b = v
        light = .86 + .14 * min(1, max(r, g, b))
        if denim:
            if name.startswith('Crossed back strap') and r > g:
                color = (r, g, b)
            elif male and name.startswith('Front suspender'):
                color = (.76, .55, .33)
            else:
                thread = .018 * sin(420*z + 210*x) * sin(370*x - 170*y)
                color = (.233+thread, .324+thread, .447+thread)
        elif male:
            # Continue the check over the collar and sleeves using garment coordinates.
            u = x + .46*y
            v = z - .21*abs(x) if abs(x) > .12 else z - .0252
            warp = exp(-12*sin(pi*u/.053)**2)
            weft = exp(-11*sin(pi*v/.051)**2)
            grid = .086*(warp+weft) + .023*cos(2*pi*u/.106)*cos(2*pi*v/.102)
            color = (.58+grid, .198+grid*.81, .165+grid*.66)
            if name.startswith('Sleeve cuff'):
                color = tuple(c*.90 for c in color)
        elif name.startswith('Sleeve cuff'):
            color = (.92, .83, .67)
        else:
            fold = .028*cos(35*x + 12*y + 10*z)
            color = (.18+fold, .44+fold, .42+fold)
        contrast = .78 + .28 * (max(r, g, b)/max(.32, light))
        if name.startswith('Shirt sleeve'):
            # Reshape the upper sleeve and leave its join at the cuff intact.
            t = max(0,min(1,(z-.786)/.078))
            x *= 1-.058*t
            y *= 1-.10*t
            z -= .012*t
        if name.startswith(('Shirt torso','Overall bib')):
            x *= 1-(.043 if male else .071)*exp(-((z-.666)/.055)**2)
        if name.startswith('Overall bib'):
            center = -.019 if male else -.023
            edge = ((x-center)/.145)**2
            top = max(0,min(1,(z-.755)/.066))
            x = center+(x-center)*(1-.10*top)
            y -= .016*edge
            z -= .016*edge*top
        return (x, y, z, *(min(1, c*contrast) for c in color))

    result = []
    for i in range(0,len(floats),18):
        corners = [floats[j:j+6] for j in range(i,i+18,6)]
        # Metal and seams keep their original geometry. Subdivide plaid faces
        # only where an edge is long enough to skip over a stripe.
        span = max(sum((a[k]-b[k])**2 for k in range(3)) for a,b in zip(corners,corners[1:]+corners[:1]))
        steps = min(7,max(1,int(sqrt(span)/.010)+1)) if shirt and male else 1
        a,b,c = corners
        grid = {}
        for j in range(steps+1):
            for k in range(steps-j+1):
                grid[j,k] = shade(tuple(a[m]+((b[m]-a[m])*j+(c[m]-a[m])*k)/steps for m in range(6)))
        for j in range(steps):
            for k in range(steps-j):
                for point in (grid[j,k],grid[j+1,k],grid[j,k+1]):
                    result.extend(point)
                if j+k<steps-1:
                    for point in (grid[j+1,k],grid[j+1,k+1],grid[j,k+1]):
                        result.extend(point)
    return result


def pocket(bib, male):
    """Build a bevel, stitched rim, and emblem on a shared curved surface."""
    verts = [Vector(bib[i:i+3]) for i in range(0,len(bib),6)]
    triangles = [(i,i+1,i+2) for i in range(0,len(verts),3)]
    surface = BVHTree.FromPolygons(verts, triangles, all_triangles=True)
    center = -.019 if male else -.023
    mid = .677 if male else .682
    width, height = (.113,.076) if male else (.103,.072)
    trim = (.84,.57,.29)
    cloth = (.64,.235,.172) if male else (.145,.365,.33)
    cream = (.99,.89,.66)
    triangles = []

    def point(x,z,lift,color):
        px,pz = center+x,mid+z
        hit,*_ = surface.ray_cast(Vector((px,1,pz)), Vector((0,-1,0)))
        # The pocket follows the front of the bib under its cloth edging.
        backing = hit.y if hit is not None else .131 + x*.17
        depth = .005*(1-(x/width)**2)
        return (px,backing+depth+lift,pz,*color)

    def tri(a,b,c):
        for v in (a,b,c):
            triangles.extend(v)

    def shape(a,scale):
        # Squared upper corners, rounded lower corners and a subtle taper.
        c,s = cos(a),sin(a)
        return scale*width*(.955+.045*s)*abs(c)**.42*(1 if c>=0 else -1), scale*height*abs(s)**.48*(1 if s>=0 else -1)

    count = 96
    rings = [(0,.017,cloth),(.30,.017,cloth),(.58,.017,cloth),(.80,.016,cloth),
             (.935,.014,cloth),(1,.010,cloth), (1,.002,tuple(c*.72 for c in cloth))]
    for inner,outer in zip(rings,rings[1:]):
        for i in range(count):
            a,b = i*2*pi/count,(i+1)*2*pi/count
            p,q = (point(*shape(angle,inner[0]),inner[1],inner[2]) for angle in (a,b))
            r,s = (point(*shape(angle,outer[0]),outer[1],outer[2]) for angle in (a,b))
            tri(p,r,q)
            tri(q,r,s)

    def ribbon(coords, thickness, lift, color):
        for (x1,z1),(x2,z2) in zip(coords,coords[1:]):
            dx,dz = x2-x1,z2-z1
            size = sqrt(dx*dx+dz*dz)
            if size<1e-8:
                continue
            ox,oz = -dz*thickness/size,dx*thickness/size
            a,b = point(x1+ox,z1+oz,lift,color),point(x1-ox,z1-oz,lift,color)
            c,d = point(x2+ox,z2+oz,lift,color),point(x2-ox,z2-oz,lift,color)
            tri(a,b,c)
            tri(c,b,d)

    # Evenly spaced stitch dashes along the rounded edge.
    outline = [shape(i*2*pi/count,.903) for i in range(count+1)]
    carry = 0
    for start,end in zip(outline,outline[1:]):
        x,z = start
        dx,dz = end[0]-x,end[1]-z
        length = sqrt(dx*dx+dz*dz)
        if not length:
            continue
        t = 0
        while t<length-1e-8:
            used = min(length-t, (.0049 if carry<.0049 else .009)-carry)
            if carry<.0049:
                ribbon([(x+dx*i/length,z+dz*i/length) for i in (t,t+used)],.0011,.019,trim)
            t += used
            carry = (carry+used)%.009

    for i in range(-9,10):
        x = width*i/11
        z = (.119 if male else .121) - .008*(x/width)**2
        ribbon([(x-.0023,z),(x+.0023,z)],.0009,.003,trim)
    lip = [(x, .059-.004*(x/width)**2) for x in [width*i/12 for i in range(-10,11)]]
    ribbon(lip,.0021,.020,tuple(c*.63 for c in cloth))
    if male:
        # The cutout and outer arc meet at the two circle intersections.
        outer,inner = .047,.038
        ox,oz = .021,.022
        distance = sqrt(ox*ox+oz*oz)
        direction = atan2(oz,ox)
        hit = (outer*outer-inner*inner+distance*distance)/(2*distance)
        alpha = acos(hit/outer)
        beta = acos((hit-distance)/inner)
        def crescent(t, radius, half, x, z):
            a = direction+half+(2*pi-2*half)*t
            return point(x+radius*cos(a)-.004,z+radius*sin(a)-.002,.021,cream)
        for i in range(40):
            t,u = i/40,(i+1)/40
            a,b = (crescent(q,outer,alpha,0,0) for q in (t,u))
            c,d = (crescent(q,inner,beta,ox,oz) for q in (t,u))
            tri(a,b,c)
            tri(c,b,d)
    else:
        def line(a,b):
            return [(a[0]+(b[0]-a[0])*i/8,a[1]+(b[1]-a[1])*i/8) for i in range(9)]
        corners = [(0,.039),(.036,.006),(0,-.026),(-.036,.006),(0,.039)]
        for a,b in zip(corners,corners[1:]):
            ribbon(line(a,b),.0052,.021,cream)
        ribbon(line((-.036,-.039),(.036,-.039)),.0048,.021,cream)
    return triangles
