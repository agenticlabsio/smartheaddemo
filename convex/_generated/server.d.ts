/* eslint-disable */
/**
 * Generated server utilities.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import {
  ActionBuilder,
  MutationBuilder,
  QueryBuilder,
  DatabaseReader,
  DatabaseWriter,
} from "convex/server";
import { GenericId } from "convex/values";

/**
 * Define a query in this Convex app's public API.
 *
 * This function will be allowed to read your Convex database and will be accessible from the client.
 *
 * @param func - The query function. It receives a `DatabaseReader` as the first argument.
 * @returns The wrapped query function.
 */
export declare const query: QueryBuilder<any, "public">;

/**
 * Define a mutation in this Convex app's public API.
 *
 * This function will be allowed to modify your Convex database and will be accessible from the client.
 *
 * @param func - The mutation function. It receives a `DatabaseWriter` as the first argument.
 * @returns The wrapped mutation function.
 */
export declare const mutation: MutationBuilder<any, "public">;

/**
 * Define an action in this Convex app's public API.
 *
 * An action can call third-party services and is broader than a query or mutation.
 *
 * @param func - The action function.
 * @returns The wrapped action function.
 */
export declare const action: ActionBuilder<any, "public">;