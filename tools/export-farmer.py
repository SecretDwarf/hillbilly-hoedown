import bpy
import json
import sys
from array import array
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from math import cos, exp, sin, pi, hypot
from pathlib import Path
from runpy import run_path

root_name, output = sys.argv[sys.argv.index('--')+1:]
root = bpy.data.objects[root_name]
male = root_name == 'Male Farmer'
back_surface = None
seat_surface = None
# The old separate features are replaced by the continuous face surface.
legacy_features = (
    "Continuous resting face", "Brow", "Ear", "Copper hair cap", "Sculpted ponytail lock",
    "Swept hair lock", "Tied ponytail base", "Teal ponytail tie",
    "Back suspender",
    'Closed smile crease', 'Inset almond eye', 'Hazel iris', 'Pupil', 'Eye glint',
    'Upper lash', 'Lower eye rim', 'Relaxed brow', 'Curled mustache', 'Mustache curl', 'Freckle',
)
depsgraph = bpy.context.evaluated_depsgraph_get()
light = Vector((-0.45,-0.65,0.8)).normalized()
parts = []
for obj in root.children_recursive:
    if obj.type not in {'MESH','CURVE'} or obj.hide_render:
        continue
    if obj.name.startswith(legacy_features) or (male and obj.name.startswith("Back hair lock")):
        continue
    if obj.type=='MESH' and len(obj.data.polygons)>650:
        decimate = obj.modifiers.new('Preview triangle budget', 'DECIMATE')
        decimate.ratio = max(0.14, min(0.6, 260 / len(obj.data.polygons)))
        bpy.context.view_layer.update()
    evaluated = obj.evaluated_get(depsgraph)
    mesh = evaluated.to_mesh()
    transform = evaluated.matrix_world
    normal_transform = transform.to_3x3().inverted().transposed()
    mesh.calc_loop_triangles()
    positions = [transform @ v.co for v in mesh.vertices]
    material_colors = []
    for material in mesh.materials:
        shader = next((n for n in material.node_tree.nodes if n.type=='BSDF_PRINCIPLED'), None) if material and material.use_nodes else None
        material_colors.append(tuple(shader.inputs['Base Color'].default_value[:3] if shader else material.diffuse_color[:3]))
    if obj.name.startswith('Overall seat'):
        seat_surface = BVHTree.FromPolygons(positions, [t.vertices[:] for t in mesh.loop_triangles], all_triangles=True)
    if obj.name.startswith('Shirt torso'):
        back_surface = BVHTree.FromPolygons(positions, [t.vertices[:] for t in mesh.loop_triangles], all_triangles=True)
    if male and obj.name.startswith('Front suspender'):
        material_colors = [(.57, .32, .132)] * len(material_colors)
    parts.append((obj.name, positions,[(t.vertices[:], tuple((normal_transform @ mesh.corner_normals[i].vector).normalized().dot(light) for i in t.loops), material_colors[t.material_index]) for t in mesh.loop_triangles]))
    evaluated.to_mesh_clear()
def profile(value, points):
    for (a,first),(b,second) in zip(points, points[1:]):
        if value <= b:
            return first + (second-first) * max(0, (value-a)/(b-a))
    return points[-1][1]

def cross_back_straps():
    center_x = root.matrix_world.translation.x
    low,high,spread,half_width = (1.28,1.89,.247,.038) if male else (.666,1.006,.109,.021)
    for side in (-1,1):
        positions,triangles = [],[]
        for row in range(27):
            u = row/26
            z = low+(high-low)*u
            x = center_x+side*(2*u-1)*spread
            for w in (-half_width,-half_width*.82,half_width*.82,half_width):
                hit,*_ = back_surface.ray_cast(Vector((x+w,5,z)),Vector((0,-1,0)))
                if hit is None:
                    raise ValueError('Crossed strap lies outside the shirt')
                # Seat both straps against the fabric, with extra clearance only at the crossing.
                crossing = exp(-((u-.5)/.10)**2)
                hit.y += (.007 if male else .0045)+(0 if side<0 else .003*crossing)
                positions.append(hit)
            if row:
                for col in range(3):
                    a = 4*row+col
                    tint = (.40,.245,.097) if col!=1 else (.067,.123,.24)
                    triangles.extend((((a-4,a-3,a),(.65,)*3,tint),((a-3,a+1,a),(.65,)*3,tint)))
        parts.append(('Crossed back strap',positions,triangles))

if back_surface is not None:
    cross_back_straps()


def add_rear_pockets():
    root_x = root.matrix_world.translation.x
    spread, half_width, mid_z, height = (.217,.148,1.097,.236) if male else (.095,.070,.575,.131)
    outline = [(-1,1),(1,1),(.92,-.58),(0,-1),(-.92,-.58)]
    for side in (-1,1):
        points,triangles = [],[]
        for amount in (0,.89,1):
            for x,z in outline:
                px = root_x + side*spread + x*half_width*amount
                pz = mid_z+z*height*.5*amount
                hit,*_ = seat_surface.ray_cast(Vector((px,5,pz)),Vector((0,-1,0)))
                if hit is None:
                    raise ValueError('Back pocket extends outside the denim seat')
                hit.y += .015 if male else .009
                points.append(hit)
        for i in range(5):
            j = (i+1)%5
            triangles.extend((
                ((0,5+i,5+j),(.81,)*3,(.059,.104,.198)),
                ((5+i,10+i,5+j),(.81,)*3,(.43,.25,.11)),
                ((5+j,10+i,10+j),(.81,)*3,(.43,.25,.11)),
            ))
        parts.append(('Stitched denim back pocket',points,triangles))

if seat_surface is not None:
    add_rear_pockets()

MALE_HAT = ('Wide straw brim', 'Brim weave', 'Straw crown', 'Red hat band')
FEMALE_HAT = ('Cap brim', 'Denim cap crown', 'Teal cap band', 'Cap topstitch')

def fit_shoulder(name,x,y,z):
    if name.startswith('Shirt torso'):
        upper = exp(-((z-.813)/.093)**2)
        return x*(1+.11*upper),y,z
    if name.startswith(('Shirt sleeve','Sleeve cuff','Forearm','Hand','Thumb')):
        # Move the whole arm with the sleeve so the cuff and skin stay joined.
        outer = max(0,min(1,(abs(x)-.13)/.16))
        x *= 1-(.14 if male else .17)*outer
        z -= (.033 if male else .039)*outer
        if name.startswith('Shirt sleeve'):
            peak = max(0,min(1,(z-.75)/.14))
            y *= 1-.14*peak
            z -= (.029 if male else .037)*peak*outer
        return x,y,z
    return x,y,z

floor = min(v.z for _,vertices,_ in parts for v in vertices)
height = max(v.z for _,vertices,_ in parts for v in vertices)-floor
scale = 1.22 / height
center = root.matrix_world.translation
refinement = run_path(str(Path(__file__).with_name('refine-farmer-torso.py')))
lower_fit = run_path(str(Path(__file__).with_name('refine-farmer-legs.py')))
buffer = array('f')
denim_legs = []
wave_sections = []
bib = None
for name, vertices, triangles in parts:
    if name.startswith(('Forearm', 'Hand', 'Thumb', 'Oversized teal bib pocket', 'Bib pocket opening', 'Bib pocket stitching',
                        'Printed Diamond over Bar', 'Plaid cross-thread', 'Plaid vertical thread')) or name == 'Cream crescent print':
        continue
    start = len(buffer)
    forward_leg = not male and sum(v.x-center.x for v in vertices)<0
    for corners, lighting, color in triangles:
        for index, angle in zip(corners, lighting):
            v = vertices[index]
            shade = .63 + .37 * max(0,angle)
            x, y, z = -(v.x-center.x)*scale, -(v.y-center.y)*scale, (v.z-floor)*scale
            if male:
                x *= profile(z, [(0,1.04),(.18,1.01),(.49,.95),(.75,.89),(1.03,.93),(1.22,1.0)])
                z = profile(z, [(0,0),(.19,.19),(.51,.55),(.85,.88),(1.22,1.22)])
                if name.startswith(MALE_HAT):
                    x *= 1.23
                    y *= 1.16
                    z += -.17*x+.19*y+.18*max(0,z-1.08)
            else:
                x *= profile(z, [(0,1.04),(.35,.98),(.67,.96),(.93,.97),(1.22,1.0)])
                z = profile(z, [(0,0),(.19,.19),(.5,.53),(.86,.87),(1.22,1.22)])
                if name.startswith(FEMALE_HAT):
                    z -= x * .07
            x,y,z = fit_shoulder(name,x,y,z)
            if name.startswith('Denim leg'):
                leg_center = .116 if x > 0 else -.116
                taper = profile(z,[(.13,.91),(.23,.94),(.36,.84),(.53,.97),(.64,1)])
                x = leg_center+(x-leg_center)*taper
                y += .014*exp(-((z-.38)/.09)**2)
            if name.startswith(('Boot leather', 'Boot sole', 'Boot shaft', 'Boot lace', 'Rolled cuff')):
                side = -1 if x < 0 else 1
                boot_center = .117 * side
                x = boot_center + (x-boot_center)*.9
                y *= .93
                if name.startswith('Boot sole'):
                    toe = max(0,min(1,(y-.052)/.12))
                    x = boot_center+(x-boot_center)*(1-.29*toe)
                    z = .011+(z-.011)*.75
                if name.startswith('Boot leather'):
                    y += .014*max(0,min(1,y/.12))
            if name.startswith(MALE_HAT if male else FEMALE_HAT):
                z += .063 if male else .070
            x,y,z = lower_fit['fit'](name,x,y,z,male,forward_leg)
            buffer.extend((x,y,z + .012))
            tint = lower_fit['color'](name,x,y,z,color,male)
            if name.startswith('Shirt sleeve'):
                fold = exp(-((z-.717-abs(x)*.08)/.013)**2)
                shade *= 1-.10*fold
            if name.startswith('Boot lace'):
                tint = (.51,.29,.096)
            if male and name.startswith(('Straw crown','Wide straw brim')):
                fiber = sin(z*395 + .7*sin(x*115))*.041 + sin((x*x+y*y)**.5*390)*.038
                shade *= 1+fiber
            if name.startswith('Denim cap crown'):
                fiber = sin(x*580+z*190)*sin(y*440-z*400)
                tint = (.056,.111,.209)
                shade *= 1+.065*fiber
            if name.startswith('Cap brim'):
                tint = (.036,.215,.174)
            if name.startswith('Cap topstitch'):
                tint = (.47,.30,.13)
            buffer.extend(min(1,max(0,c)*shade)**(1/2.2) for c in tint)
    if name.startswith('Denim leg'):
        denim_legs.append(buffer[start:])
    if name.startswith(('Shirt torso', 'Shirt sleeve', 'Shirt collar flap', 'Sleeve cuff',
                        'Overall bib', 'Crossed back strap', 'Front suspender')):
        original = buffer[start:]
        refined = array('f', refinement['fabric'](name, original, male))
        if name.startswith('Overall bib'):
            bib = refined
        buffer[start:] = refined
    if name.startswith(('Shirt sleeve','Sleeve cuff')) and sum(v.x-center.x for v in vertices)<0:
        wave_sections.append((start//6,len(buffer)//6,'sleeve'))
if bib is None:
    raise ValueError('Front bib mesh is missing')
buffer.extend(refinement['pocket'](bib, male))
for leg in denim_legs:
    lower_fit['stitches'](buffer,leg)
arm_start = len(buffer)//6
run_path(str(Path(__file__).with_name('sculpt-farmer-arms.py')))['build_arms'](buffer,male)
arm_end = len(buffer)//6
wave_sections.append(((arm_start+arm_end)//2,arm_end,'hand'))
Path(output).with_suffix('.wave.json').write_text(json.dumps(wave_sections)+'\n')
run_path(str(Path(__file__).with_name('sculpt-farmer-head.py')))['build_head'](buffer,male)
with open(output,'wb') as stream:
    buffer.tofile(stream)
print(root_name, len(buffer)//18, 'triangles', center[:], height)
