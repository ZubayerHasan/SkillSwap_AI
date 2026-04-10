// Map aliases to canonical skill names (lowercase)
const ALIAS_MAP = {
  js: "javascript",
  "node.js": "node",
  nodejs: "node",
  reactjs: "react",
  "react.js": "react",
  py: "python",
  c_sharp: "c#",
  golang: "go",
  "photoshop": "adobe photoshop",
  "premiere": "adobe premiere pro",
  "after effects": "adobe after effects",
};

const normalizeSkillName = (name) => {
  if (!name) return "";
  const lower = name.trim().toLowerCase();
  return ALIAS_MAP[lower] || lower;
};

module.exports = { normalizeSkillName };
