"""Shape the lower garments and sew the outer seams in export coordinates."""
from math import exp, sin

from mathutils import Vector
from mathutils.bvhtree import BVHTree


def fit(name, x, y, z, male, forward_leg):
    denim = name.startswith(('Denim leg', 'Overall seat'))
    cuff = name.startswith('Rolled cuff')
    boot = name.startswith(('Boot leather', 'Boot sole', 'Boot shaft', 'Boot lace'))
    if denim:
        if name.startswith('Denim leg'):
            center = .116 if x > 0 else -.116
            knee = exp(-((z-.34)/.090)**2)
            shin = exp(-((z-.235)/.065)**2)
            x = center + (x-center)*(1-.08*knee+.035*shin)
            y += .012*knee
        else:
            lower = max(0,min(1,(.57-z)/.17))
            x *= 1-.065*lower
        if y > 0:
            y += .005*sin(81*z+18*abs(x))*exp(-((z-.33)/.10)**2)
    if cuff:
        # Slightly compressed at the ankle, with a lip at the upper fold.
        center = (.121 if male else .081)*(1 if x>0 else -1)
        fold = exp(-((z-(.193 if male else .232))/.023)**2)
        x = center+(x-center)*(.96+.045*fold)
    if not male and forward_leg:
        if boot or cuff:
            z -= .022
        elif name.startswith('Denim leg'):
            z -= .022*max(0,min(1,(.42-z)/.24))
    return x,y,z


def color(name, x, y, z, base, male):
    if name.startswith(('Denim leg','Overall seat')):
        weave = .040*sin(328*z+207*x+108*y)
        crease = .065*sin(z*72+abs(x)*26)*exp(-((z-.34)/.12)**2)
        faded = .078*exp(-((z-.32)/.089)**2)*max(0,min(1,(y+.025)*14))
        return tuple(c*(1+weave+crease+faded) for c in (.061,.103,.191))
    if name.startswith('Rolled cuff'):
        fiber = sin(x*350+y*150-z*210)*.075
        return tuple(c*(1+fiber) for c in (.57,.49,.41))
    if name.startswith('Boot sole'):
        ribs = max(0,sin(y*175+abs(x)*24))
        floor = .024 if male else .055
        edge = .68+.27*max(0,min(1,(z-floor)/.025))+.12*ribs
        return (.28*edge,.154*edge,.077*edge)
    if name.startswith(('Boot leather','Boot shaft')):
        gloss = .032*exp(-((z-.086)/.038)**2)
        return (.36+gloss,.188+gloss*.63,.088+gloss*.28)
    if name.startswith('Leather wraparound tool belt'):
        return (.24,.134,.071)
    if name.startswith('Hip pouch leather backing'):
        return (.44,.25,.123)
    return base


def stitches(buffer, leg):
    vertices = [Vector(leg[i:i+3]) for i in range(0,len(leg),6)]
    surface = BVHTree.FromPolygons(vertices,[(i,i+1,i+2) for i in range(0,len(vertices),3)],all_triangles=True)
    side = 1 if sum(v.x for v in vertices)>0 else -1
    z_min,z_max = min(v.z for v in vertices),max(v.z for v in vertices)
    color = (.65,.46,.27)

    def point(z, offset):
        # Locate the outside of the actual denim at each stitch height.
        hit,*_ = surface.ray_cast(Vector((side*.5,z*.34-.106+offset,z)),Vector((-side,0,0)))
        if hit is None:
            return None
        hit.x += side*.0016
        return (*hit,*color)

    z = z_min+.078
    while z<min(z_max-.045,.492):
        a,b,c,d = point(z,-.001),point(z,.001),point(z+.005,-.001),point(z+.005,.001)
        if all(p is not None for p in (a,b,c,d)):
            for p in (a,b,c,b,c,d):
                buffer.extend(p)
        z += .010
