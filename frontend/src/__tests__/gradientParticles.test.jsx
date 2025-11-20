import { createGradientParticles } from "../features/info/components/GradientParticles";

describe("createGradientParticles", () => {
  it("returns deterministic particle data", () => {
    const first = createGradientParticles();
    const second = createGradientParticles();

    expect(first).toHaveLength(20);
    expect(second).toHaveLength(20);
    expect(first).toEqual(second);
  });

  it("keeps particle attributes within expected ranges", () => {
    const particles = createGradientParticles();
    particles.forEach((particle) => {
      expect(particle.size).toBeGreaterThanOrEqual(100);
      expect(particle.size).toBeLessThanOrEqual(300);
      expect(particle.x).toBeGreaterThanOrEqual(0);
      expect(particle.x).toBeLessThanOrEqual(100);
      expect(particle.y).toBeGreaterThanOrEqual(0);
      expect(particle.y).toBeLessThanOrEqual(100);
      expect(particle.duration).toBeGreaterThanOrEqual(15);
      expect(particle.duration).toBeLessThanOrEqual(35);
      expect(particle.delay).toBeGreaterThanOrEqual(0);
      expect(particle.delay).toBeLessThanOrEqual(5);
      expect(Array.isArray(particle.colors)).toBe(true);
      expect(particle.colors.length).toBe(2);
    });
  });
});
