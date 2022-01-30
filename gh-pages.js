const ghpages = require("gh-pages");

ghpages.publish(
  "public",
  {
    branch: "gh-pages",
    repo: "https://github.com/johnchambers96/svelte-mortgage-calculator.git",
    user: {
      name: "John Chambers",
      email: "cjohn772@gmail.com",
    },
    dotfiles: true,
  },
  () => {
    console.log("Deploy Complete!");
  }
);
