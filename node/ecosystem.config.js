module.exports = {
  apps: [{
    name: "eureka-operator",
    script: "./app.mjs",
    env: {
      NODE_ENV: "production",
    }
  }]
}
