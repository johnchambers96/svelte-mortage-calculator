const ghpages = require("gh-pages");

ghpages.publish(
  "public", // path to public directory
  {
    branch: "gh-pages",
    repo: "https://johnchambers96.github.io/svelte-mortage-calculator.git", // Update to point to your repository
    user: {
      name: "John Chambers", // update to use your name
      email: "cjohn772@gmail.com", // Update to use your email
    },
  },
  () => {
    console.log("Deploy Complete!");
  }
);
