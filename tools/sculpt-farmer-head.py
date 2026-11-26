"""Build both stylized farmer heads as geometry in the Movement Lab mesh format."""
from math import cos, exp, pi, sin, sqrt
from mathutils import Vector


def build_head(buffer, male):
    skin = (.91,.59,.41) if male else (.95,.64,.45)
    hair = (.22,.107,.057) if male else (.54,.235,.105)
    crest = 1.047
    width, depth, height = (.159,.158,.195) if male else (.151,.148,.186)
    mid_y = -.023
    eye_z = 1.080 if male else 1.079
    mouth_z = .974 if male else .972
    eye_spacing = .054 if male else .063
    eye_width, eye_height = (.027,.027) if male else (.039,.033)
    lip_width, lip_height = (.059,.025) if male else (.062,.025)

    def gauss(x,z,sx,sz):
        return exp(-(x/sx)**2-(z/sz)**2)

    def jaw_taper(v):
        return 1+.24*max(0,-v)**.82 if male else 1-.27*max(0,-v)**1.25

    def smile_shape(x,z):
        t = (z-mouth_z-.014*(x/lip_width)**2)/lip_height
        width_at_height = lip_width*(.89+.20*max(-1,min(1,t))) if male else lip_width
        return (x/width_at_height)**2+t*t

    def front(x,z):
        v = (z-crest)/height
        taper = jaw_taper(v)
        y = mid_y + depth*sqrt(max(.001,1-v*v-(x/(width*taper))**2))
        y += (.030*gauss(abs(x)-.088,z-.993,.052,.052) if male
              else .019*gauss(abs(x)-.091,z-.998,.051,.049))
        y += .011*gauss(x,z-1.057,.025,.035)
        y -= .018*gauss(abs(x)-eye_spacing,z-eye_z,.043,.040)
        y += .018*gauss(x,z-.926,.074,.034)
        y += .014*gauss(x,z-mouth_z-.023,.070,.020)
        y -= .009*gauss(abs(x)-lip_width,z-mouth_z-.014,.013,.014)
        mouth = smile_shape(x,z)
        y -= .028*max(0,1-mouth)**.59
        return y

    def emit(p,n,color):
        normal = Vector(n).normalized()
        light = max(0,normal.dot(Vector((-.45,.73,.52)).normalized()))
        factor = .76+.24*light
        buffer.extend((*p,*(min(1,c*factor) for c in color)))

    def surface(rows,cols,sample):
        grid = [[sample(i/rows,j/cols) for j in range(cols+1)] for i in range(rows+1)]
        for row in range(rows):
            for col in range(cols):
                a,b = grid[row][col:col+2]
                c,d = grid[row+1][col:col+2]
                for point in (a,c,b,b,c,d):
                    emit(*point)

    def ellipsoid(center,scale,color,rows=22,cols=36):
        def sample(v,u):
            a,t = u*2*pi, v*pi
            n = (sin(t)*cos(a),sin(t)*sin(a),cos(t))
            return tuple(c+r*e for c,r,e in zip(center,scale,n)), tuple(e/r for e,r in zip(n,scale)),color
        surface(rows,cols,sample)

    def skull(v,u):
        z = crest+height*cos(pi*v)
        a = u*2*pi
        radius = sin(pi*v)
        taper = jaw_taper(cos(pi*v))
        x = width*taper*radius*sin(a)
        y = mid_y+depth*radius*cos(a)
        if cos(a)>0:
            outer = max(0,min(1,cos(a)*5))
            y += (front(x,z)-y)*outer
            dx = (front(x+.001,z)-front(x-.001,z))/.002
            dz = (front(x,z+.001)-front(x,z-.001))/.002
            n = (-dx,1,-dz)
        else:
            n = (sin(a)*radius,cos(a)*radius,cos(pi*v))
        blush = .39*gauss(abs(x)-.092,z-1.003,.040,.041)*max(0,cos(a))
        color = tuple(c*(1-blush)+r*blush for c,r in zip(skin,(.91,.37,.29)))
        mouth = smile_shape(x,z)
        if not male and cos(a)>0 and mouth < 1.23:
            rim = max(0,min(1,(1.23-mouth)/.34))
            opening = max(0,min(1,(.98-mouth)/.18))
            color = tuple(c*(1-rim)+((1-opening)*r+opening*m)*rim
                          for c,r,m in zip(color,(.76,.337,.282),(.115,.030,.027)))
        if not male and cos(a)>.58 and .047<abs(x)<.116 and .985<z<1.047:
            for fx,fz in ((.060,1.023),(.073,1.014),(.083,1.028),(.092,1.013),(.100,1.023)):
                freckle=.45*gauss(abs(x)-fx,z-fz,.004,.0048)
                color=tuple(c*(1-freckle)+f*freckle for c,f in zip(color,(.68,.34,.21)))
        hairline = 1.151-.105*max(0,-cos(a))-.054*abs(sin(a))**4
        hairline += .007*sin(12*a+.4)*sin(12*a+.4)
        if z>hairline-.006:
            strand = .92+.11*cos(a*27+z*19)
            fade = max(0,min(1,(z-hairline+.006)/.009))
            color = tuple(c*(1-fade)+h*strand*fade for c,h in zip(color,hair))
        return (x,y,z),n,color
    surface(112,144,skull)

    def eye(side):
        cx = side*eye_spacing
        cz = eye_z + (.003*side if male else 0)
        tilt = .045 if male else .17

        def edge(t, upper):
            curve = max(0,1-t*t)**(.52 if male else .71)
            return cz + tilt*eye_width*t + eye_height*(1+.085*side if male else 1)*curve*(1 if upper else -.78)

        def eye_depth(x,z):
            t = max(-1,min(1,(x*side-cx*side)/eye_width))
            bottom,top = edge(t,False),edge(t,True)
            vertical = (z-bottom)/max(.0001,top-bottom)
            arch = sin(pi*max(0,min(1,vertical)))**.72
            return front(x,z)+.006+.023*arch*max(0,1-t*t)**.72

        def opening(v,u):
            t = 2*u-1
            x = cx+side*eye_width*t
            z = edge(t,False)*(1-v)+edge(t,True)*v
            warm = .94+.06*sin(pi*v)
            return (x,eye_depth(x,z),z),(0,1,.1),(.992*warm,.948*warm,.870*warm)
        surface(12,38,opening)

        def decal(dx,dz,rx,rz,lift,color):
            def sample(v,u):
                a = u*2*pi
                x,z = cx+dx+rx*v*cos(a),cz+dz+rz*v*sin(a)
                return (x,eye_depth(x,z)+lift,z),(0,1,.13),color
            surface(7,32,sample)

        decal(-.002,.003,.017,.020,.001,(.245,.123,.068))
        decal(-.002,.003,.013,.017,.0015,(.40,.225,.105))
        decal(-.002,.004,.009,.014,.0022,(.059,.040,.031))
        decal(-.006,.012,.004,.005,.0032,(1,.978,.906))
        decal(.005,-.004,.0018,.0022,.0032,(.87,.75,.58))

        def lid(v,u,upper):
            t = 2*u-1
            x = cx+side*eye_width*t
            z = edge(t,upper)
            z += (1 if upper else -1)*v*max(0,1-t*t)**.58*(.014 if upper else .010)
            y = front(x,z)+.001+.006*(1-v)
            near = (.31,.16,.115) if upper else (.80,.431,.328)
            blend = max(0,(v-.16)/.84)
            color = tuple(a*(1-blend)+b*blend for a,b in zip(near,skin))
            return (x,y,z),(0,1,.28 if upper else -.25),color
        surface(8,40,lambda v,u:lid(v,u,True))
        surface(6,40,lambda v,u:lid(v,u,False))

        def brow(v,u):
            t = 2*u-1
            taper = max(0,1-t*t)**.60
            x = cx+side*.041*t
            z = cz + (.047 if male else .049)+.014*taper-.007*t + (v-.5)*.017*taper
            y = front(x,z)+.003+.004*sin(pi*v)*taper
            tone = (.94+.10*sin(u*30+v))
            return (x,y,z),(0,1,.30),tuple(c*tone for c in hair)
        surface(7,38,brow)

    for side in (-1,1):
        eye(side)
        ex = side*(width-.009)
        ellipsoid((ex,-.009,1.014),(.025,.036,.045),skin)
        ellipsoid((ex+side*.014,.006,1.015),(.009,.022,.026),(.74,.420,.295),14,22)

    nose_z = 1.028 if male else 1.031
    ellipsoid((0,front(0,nose_z)-.007,nose_z),
              (.046,.044,.035) if male else (.027,.028,.023),
              (.96,.462,.312) if male else (.92,.526,.385))
    if male:
        def mouth_surface(v,u):
            angle = 2*pi*u
            t = v*sin(angle)
            x = lip_width*(.89+.20*max(-1,min(1,t)))*v*cos(angle)
            z = mouth_z+lip_height*t+.014*(x/lip_width)**2
            y = front(x,z)+.0035
            tongue = gauss(x,z-(mouth_z-.019),.033,.012)
            red = (.74,.255,.257)
            dark = (.102,.025,.030)
            color = tuple(a+(b-a)*tongue for a,b in zip(dark,red))
            return (x,y,z),(0,1,0),color
        surface(28,112,mouth_surface)

        def lower_lip(v,u):
            angle = pi*(1+u)
            radius = 1+.12*v
            x = lip_width*(.89+.20*sin(angle))*radius*cos(angle)
            z = mouth_z+lip_height*radius*sin(angle)+.014*(x/lip_width)**2
            roll = sin(pi*v)*sin(pi*u)
            y = front(x,z)+.001+.0035*roll
            blend = .48*sin(pi*u)*(1-v)
            color = tuple(a+(b-a)*blend for a,b in zip(skin,(.73,.36,.28)))
            return (x,y,z),(0,1,-.12),color
        surface(8,64,lower_lip)
    def smile_teeth(v,u):
        t = 2*u-1
        x = lip_width*.83*t
        z = mouth_z + (.013 if male else .014) + (.010 if male else .011)*t*t - v*(.010 if male else .014)*sqrt(max(0,1-t*t))
        y = front(x,z)+(.010 if male else .007)+.006*(1-t*t)
        return (x,y,z),(0,1,.12),(.99,.92,.80)
    surface(8,36,smile_teeth)
    if not male:
        tongue_z = mouth_z-.013
        ellipsoid((0,front(0,tongue_z)+.004,tongue_z),
                  (lip_width*.47,.010,.008),(.64,.244,.226),16,28)
    if male:
        for side in (-1,1):
            def mustache(v,u):
                x = side*(-.004+.113*u-.018*u**5)
                z = 1.018-.007*sin(pi*u)+.017*u**3
                y = front(x,z)+.019*(1-.65*u)
                radius = (.011+.008*sin(pi*u*.84))*sqrt(max(0,min(1,(1-u)/.15)))
                angle = v*2*pi
                groove = .90+.14*cos(7*angle+u*5)+.05*cos(13*angle+u*11)
                tone = tuple(c*groove for c in (.38,.222,.139))
                return (x,y+radius*cos(angle),z+.84*radius*sin(angle)),(.16*side,cos(angle),sin(angle)),tone
            surface(24,34,mustache)
    else:
        copper = (.66,.298,.115)
        ellipsoid((.134,-.129,1.084),(.034,.037,.036),(.139,.286,.242),16,26)

        def lock(points, thickness, tone):
            start,control,tip = map(Vector,points)
            def strand(v,u):
                center = (1-u)**2*start + 2*u*(1-u)*control + u*u*tip
                tangent = ((1-u)*(control-start)+u*(tip-control)).normalized()
                across = tangent.cross(Vector((0,1,0))).normalized()
                normal = across.cross(tangent).normalized()
                a = v*2*pi
                direction = across*cos(a)+normal*sin(a)*.83
                groove = 1+.070*cos(7*a+u*5)
                radius = thickness*(.46+.68*sin(pi*u)**.68)*(1-u**7)*groove
                hue = .90+.14*cos(5*a+1.8*u)+tone
                return tuple(center+radius*direction),direction,tuple(c*hue for c in copper)
            surface(26,34,strand)

        for i in range(5):
            t = i/4
            lock(((.138,-.148,1.091-.009*t),
                  (.236+.014*t,-.216+.060*t,.929+.038*t),
                  (.220+.027*t,-.197+.073*t,1.073+.022*t)),
                 .035-.007*t,(i%3-1)*.06)
        # The swept temple locks end above the eyes and merge into the hairline.
        lock(((.033,.092,1.180),(-.086,.098,1.184),(-.125,.065,1.103)),.023,.04)
        lock(((-.025,.091,1.172),(-.108,.069,1.169),(-.137,.027,1.090)),.020,-.02)
