module.exports = require("helmet")({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "https://stackpath.bootstrapcdn.com/",
        "https://www.aspiesolutions.com/",
        "http://localhost:3000/",
      ],
    },
  },
  expectCt: {
    maxAge: 0,
    reportUri: "http://aspiesolutions.com/reportct",
  },
  featurePolicy: {
    features: {
      layoutAnimations: ["'self'"],
      syncScript: ["'self'"],
      documentDomain: ["'none'"],
    },
  },
});
