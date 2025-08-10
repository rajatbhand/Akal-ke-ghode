const plugins = [];
if (process.env.NODE_ENV !== "production") {
  plugins.push("@tailwindcss/postcss");
}

export default { plugins };
