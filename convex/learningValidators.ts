import { v } from 'convex/values';
export const learningValidator=v.object({start:v.union(v.string(),v.null()),current:v.number(),learned:v.array(v.number()),revisit:v.array(v.number()),favourites:v.array(v.number()),hidden:v.boolean(),milestone:v.boolean()});
