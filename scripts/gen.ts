const main = async () => {
  await Bun.$`rm -rf out`
  const shareConfig: Partial<Bun.BuildConfig> = {
    minify: true,
    outdir: "out",
    root: "src",
  }
  await Bun.build({
    ...shareConfig,
    splitting: true,
    entrypoints: [
      "src/jsx-runtime.ts",
      "src/index.ts",
      "src/client.ts",
      "src/proxy.ts",
    ],
  })
  await Bun.build({
    ...shareConfig,
    entrypoints: ["src/bundle.js"],
  })
}

if (import.meta.main) {
  main();
}
