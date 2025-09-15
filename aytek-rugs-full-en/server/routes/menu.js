const router = require("express").Router();

router.get("/menu", (_req, res) => {
  res.json({
    services: [
      { label: "Cleaning", href: "/services#cleaning-form" },
      { label: "Repair", href: "/services#repair-form" },
      // ...
    ],
    policies: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Returns & Refunds", href: "/returns" },
      // ...
    ],
  });
});

module.exports = router;
