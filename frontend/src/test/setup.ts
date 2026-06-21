import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Next.js navigation hooks to prevent route navigation exceptions in tests
vi.mock("next/navigation", () => ({
  useRouter() {
    return {
      prefetch: () => null,
      push: () => null,
      replace: () => null,
    };
  },
  usePathname() {
    return "/";
  },
}));
