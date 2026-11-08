import { publicFeedHandler } from '../_shared/public-feed-handler.ts';

Deno.serve(publicFeedHandler('school'));