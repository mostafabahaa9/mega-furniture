const router = require("express").Router();
const { v4: uuidv4 } = require("uuid");
const { read, write } = require("../utils/db");
const { adminAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");
const videoUpload = require("../middleware/videoUpload");

function fileUrl(f) {
  if (!f) return null;
  if (f.path && f.path.startsWith("http")) return f.path;
  return f.filename || f.path;
}

function makeEmbedUrl(url) {
  const igMatch = url.match(/instagram\.com\/(p|reel)\/([A-Za-z0-9_-]+)/);
  if (igMatch)
    return `https://www.instagram.com/${igMatch[1]}/${igMatch[2]}/embed/`;
  return url;
}

function detectPlatform(url) {
  if (/instagram\.com/.test(url)) return "instagram";
  if (/tiktok\.com/.test(url)) return "tiktok";
  if (/facebook\.com/.test(url)) return "facebook";
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  return "other";
}

/* Public: active videos ordered by order field */
router.get("/videos", (req, res) => {
  const videos = (read("videos") || [])
    .filter((v) => v.active !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  res.json(videos);
});

/* Admin: all videos */
router.get("/admin/videos", adminAuth, (req, res) => {
  res.json(
    (read("videos") || []).sort((a, b) => (a.order || 0) - (b.order || 0)),
  );
});

/* Admin: upload video file */
router.post(
  "/admin/videos/upload/video",
  adminAuth,
  videoUpload.single("file"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    let videoPath;
    if (req.file.secure_url) {
      videoPath = req.file.secure_url;
    } else if (req.file.path && req.file.path.startsWith("http")) {
      videoPath = req.file.path;
    } else {
      videoPath = req.file.filename;
    }

    res.json({ filename: videoPath });
  }
);

/* Admin: add video */
router.post(
  "/admin/videos",
  adminAuth,
  upload.single("thumbnail"),
  (req, res) => {
    const { titleAr, titleEn, linkUrl, videoUrl, active, platform } = req.body;
    if (!linkUrl && !videoUrl) {
      return res.status(400).json({ error: "Either linkUrl or videoUrl is required" });
    }

    const videos = read("videos") || [];
    const maxOrder = videos.reduce((m, v) => Math.max(m, v.order || 0), -1);

    const isLocal = !!videoUrl;
    const finalLink = isLocal ? "" : (linkUrl || "").trim();
    const finalVideo = isLocal ? videoUrl.trim() : "";

    const video = {
      id: uuidv4(),
      titleAr: (titleAr || "").trim(),
      titleEn: (titleEn || "").trim(),
      linkUrl: finalLink,
      videoUrl: finalVideo,
      embedUrl: isLocal ? finalVideo : makeEmbedUrl(finalLink),
      platform: isLocal ? (platform || "local") : detectPlatform(finalLink),
      thumbnail: req.file ? fileUrl(req.file) : undefined,
      active: active !== "false" && active !== false,
      order: maxOrder + 1,
      createdAt: new Date().toISOString(),
    };

    videos.push(video);
    write("videos", videos);
    res.status(201).json(video);
  },
);

/* Admin: update video */
router.put(
  "/admin/videos/:id",
  adminAuth,
  upload.single("thumbnail"),
  (req, res) => {
    const videos = read("videos") || [];
    const idx = videos.findIndex((v) => v.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });

    const { titleAr, titleEn, linkUrl, videoUrl, active, platform } = req.body;
    if (titleAr !== undefined) videos[idx].titleAr = titleAr.trim();
    if (titleEn !== undefined) videos[idx].titleEn = titleEn.trim();
    
    if (videoUrl !== undefined) {
      videos[idx].videoUrl = videoUrl.trim();
      if (videoUrl.trim()) {
        videos[idx].platform = platform || "local";
        videos[idx].embedUrl = videoUrl.trim();
        videos[idx].linkUrl = "";
      }
    }
    
    if (linkUrl !== undefined) {
      if (!videos[idx].videoUrl || !videos[idx].videoUrl.trim()) {
        videos[idx].linkUrl = linkUrl.trim();
        videos[idx].embedUrl = makeEmbedUrl(linkUrl.trim());
        videos[idx].platform = detectPlatform(linkUrl.trim());
      } else if (linkUrl.trim()) {
        // Switching from video upload to link
        videos[idx].videoUrl = "";
        videos[idx].linkUrl = linkUrl.trim();
        videos[idx].embedUrl = makeEmbedUrl(linkUrl.trim());
        videos[idx].platform = detectPlatform(linkUrl.trim());
      }
    }

    // If platform is manually updated for a local video
    if (platform !== undefined && videos[idx].videoUrl) {
      videos[idx].platform = platform;
    }

    if (req.file) videos[idx].thumbnail = fileUrl(req.file);
    if (active !== undefined)
      videos[idx].active = active !== "false" && active !== false;
    videos[idx].updatedAt = new Date().toISOString();

    write("videos", videos);
    res.json(videos[idx]);
  },
);

/* Admin: delete video */
router.delete("/admin/videos/:id", adminAuth, (req, res) => {
  const videos = read("videos") || [];
  if (!videos.find((v) => v.id === req.params.id))
    return res.status(404).json({ error: "Not found" });
  write(
    "videos",
    videos.filter((v) => v.id !== req.params.id),
  );
  res.json({ success: true });
});

/* Admin: reorder (pass ordered array of ids) */
router.patch("/admin/videos/reorder", adminAuth, (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids))
    return res.status(400).json({ error: "ids array required" });
  const videos = read("videos") || [];
  ids.forEach((id, i) => {
    const v = videos.find((x) => x.id === id);
    if (v) v.order = i;
  });
  write("videos", videos);
  res.json({ success: true });
});

module.exports = router;
