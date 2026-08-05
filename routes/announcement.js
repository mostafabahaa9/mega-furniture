const router = require("express").Router();
const { read, write } = require("../utils/db");
const { adminAuth } = require("../middleware/auth");

const DEFAULT = {
  message_ar: "",
  message_en: "",
  active: false,
  link: "",
  linkText_ar: "",
  linkText_en: "",
};

/* Public: current announcement */
router.get("/announcement", (req, res) => {
  res.json(read("announcement") || DEFAULT);
});

/* Admin: save announcement */
router.post("/admin/announcement", adminAuth, (req, res) => {
  const { message_ar, message_en, active, link, linkText_ar, linkText_en } =
    req.body;
  const ann = {
    message_ar: (message_ar || "").trim(),
    message_en: (message_en || "").trim(),
    active: !!active,
    link: (link || "").trim(),
    linkText_ar: (linkText_ar || "").trim(),
    linkText_en: (linkText_en || "").trim(),
  };
  write("announcement", ann);
  res.json(ann);
});

/* Admin: clear announcement */
router.delete("/admin/announcement", adminAuth, (req, res) => {
  write("announcement", DEFAULT);
  res.json({ success: true });
});

module.exports = router;
