// Convex Auth Configuration for Clerk
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex"
    }
  ]
}