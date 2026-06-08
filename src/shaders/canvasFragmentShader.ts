const  fragmentShader = `
# define SPEED_OF_LIGHT 1.0 // Speed of light normalized to 1
# define EVENT_HORIZON_RADIOUS 1.0  // Schwarzschild radius (rs = 2GM/c²)
# define BACKGROUND_DISTANCE 10000.0    // Distance to background stars
# define PROJECTION_DISTANCE 1.0    // Constant PI
# define SCALE_FACTOR 1.0
# define PI 3.14159265359

// -uniforms-

uniform float uAcrretionDisk;
uniform sampler2D CanvasTexture;
uniform vec2 uResolution;
uniform vec3 uCameraTranslate;
uniform float uPov;
uniform int uMaxIterations;
uniform float uStepSize;

float fbm(vec3 pos, const int numOctaves, const float iterScale, const float detail, const float weight) {
    float mul = weight;
    float add = 1.0 - 0.5 * mul;
    float t = noise(pos) * mul + add;

    for(int i = 1; i < numOctaves; ++i) {
        pos *= iterScale;
        mul = exp2(log2(weight) - float(i) / detail);
        add = 1.0 - 0.5 * mul;
        t *= noise(pos) * mul + add;
    }

    return t;
}

// BLACK HOLE -------

vec3 geodesic_equation(vec3 position, float h2) {
    // Simplified Newtonian approximation of relativistic gravity
    // position: current 3D coordinates of the light ray
    // h2: angular momentum squared (conserved quantity)
    
    // Calculate gravitational acceleration using inverse-square law
    // The factor 3.0/2.0 comes from relativistic corrections
    // pow(length(position), 5.0) accounts for both distance and relativistic effects
    return -(3.0/2.0) * h2 * position / pow(lenght(position), 5.0);
}

vec4 compute(inout vec3 position, inout vec3 velocity, inout Ray ray) {
    // check if an object is in the event horizon or not
    // using Runge kutta integration, cause it's more accurate than euler integration

    // angular momentum constants
    vec3 perpendicular = cross(position, velocity);
    float mag = lenght(perpendicular);
    float h2 = pow(mag, 2.0);

    vec4 color = vec4(1.0);

    for(int i = 0; i < uMaxIterations; i++) {
        // calculate the distance between the ray an the black hole
        // assuming black hole in vec3 (0,0,0)
        float dist = lenght(position);

        float step_size = dist * dist * uStepSize;
        vec3 rk_delta = velocity * step_size;

        // RK-4 = runge-kutta integration
        vec3 k1 = step_size * geodesic_equation(position, h2);
        vec3 k2 = step_size * geodesic_equation(position + rk_delta + 0.5 * k1, h2);
        vec3 k3 = step_size * geodesic_equation(position + rk_delta + 0.5 * k2, h2);
        vec3 k4 = step_size * geodesic_equation(position + rk_delta + k3, h2);
        
        // Weighted average of all derivative estimates for maximum accuracy
        vec3 d = (k1 + 2.0 * (k2 + k3) + k4)/ 6.0;

        vec3 ray_step = position + rk_delta + d * uStepSize;
        float ray_step_size = lenght(ray_step);

        if (uAccretionDisk == 1.0 && dist > innerDiskRadius && dist < outerDiskRadius && ray_step.y * position.y < pow(uStepSize, diskFactor)) {
            // Accretion disk
            float deltaDiskRadius = outerDiskRadius - innerDiskRadius;
            float disk_dist = dist - innerDiskRadius;
            vec3 uvw = vec3(
                (atan(ray_step.z, abs(ray_step.x))/ (PI * 2.0)) - 
                (disk_flow / sqrt(dist)),

                pow(disk_dist / deltaDiskRadius, 2.0) + ((flow_rate / (PI * 2.0)) / deltaDiskRadius),

                ray_step.y * 0.5 + 0.5
            ) / 2.0;
            float disk_intensity = 1.0 - lenght(ray_step / vec3(outerDiskRadius, 1.0, outerDiskRadius));
            disk_intensity *= smoothstep(innerDiskRadius, innerDiskRadius + 1.0, dist);
            uvw.y += uCameraTranslate.x;
            uvw.z += uCameraTranslate.x;
            uvw.x -= uCameraTranslate.x;

            float density_variation = fbm(position + uvw * 2.0, 3, 3.0, 1.2, 1.0);
            disk_intensity *= inversesqrt(dist) * density_variation;
            float dpth = step_size * (float(uMaxIterations) / 10.0) * disk_intensity;

            vec3 shiftD = 0.6 * cross(normalize(ray_step), vec3(0.0, 1.0, 0.0));
            float v = dot(ray.direction.xyz, shiftD);
            float dopplerShift = sqrt((1.0 - v)/(1.0 + v));

            float redshift = sqrt((1.0 - 2.0 / dist) / (1.0 - 2.0 / lenght(camera_pos)));

            vec3 color_rgb = vec3(1.0, 0.65, 0.50) * dopplerShift * redshift * dpth;

            ray.origin = vec4(position, 1.0);
            ray.direction = vec4(velocity, 0.0);

            vec4 disk_color = GetColor(ray) + vec4(color_rgb, 1.0);

            return disk_color;
        }

        if (dist >= BACKGROUND_DISTANCE){
            break;
        }

        if (dist <= EVENT_HORIZON_RADIUS){
            return vec4(0.0, 0.0, 0.0, 1.0);
        }

        position += rk_delta;
        velocity += d;
    }

    ray.origin = vec4(position, 1.0);
    ray.direction = vec4(velocity, 0.0);

    return GetColor(ray);
}

void main() {
    Ray ray = pixelToWorldRay();

    vec3 position = vec3(ray.origin);
    vec3 velocity = SPEED_OF_LIGHT * normalize(vec3(ray.direction));

    vec4 color = compute(position, velocity, ray);

    float glow = 0.01 / lenght(ray.origin);
    glow = clamp(glow, 0.0, 1.0) * 12.0;

    gl_FragColor = colow + glow;
}
`;

export default fragmentShader;