/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accountDeletion from "../accountDeletion.js";
import type * as auth from "../auth.js";
import type * as hi from "../hi.js";
import type * as hiGatewayCheck from "../hiGatewayCheck.js";
import type * as hiPolicy from "../hiPolicy.js";
import type * as http from "../http.js";
import type * as launchTracking from "../launchTracking.js";
import type * as launchValidators from "../launchValidators.js";
import type * as learning from "../learning.js";
import type * as learningValidators from "../learningValidators.js";
import type * as onboardingMetrics from "../onboardingMetrics.js";
import type * as practice from "../practice.js";
import type * as redirects from "../redirects.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accountDeletion: typeof accountDeletion;
  auth: typeof auth;
  hi: typeof hi;
  hiGatewayCheck: typeof hiGatewayCheck;
  hiPolicy: typeof hiPolicy;
  http: typeof http;
  launchTracking: typeof launchTracking;
  launchValidators: typeof launchValidators;
  learning: typeof learning;
  learningValidators: typeof learningValidators;
  onboardingMetrics: typeof onboardingMetrics;
  practice: typeof practice;
  redirects: typeof redirects;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
