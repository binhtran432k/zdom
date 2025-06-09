const main = async () => {
	await Bun.$`rm -rf out`;
	const shareConfig: Partial<Bun.BuildConfig> = {
		minify: true,
	};
	await Bun.build({
		...shareConfig,
		root: "src",
		outdir: "out",
		splitting: true,
		entrypoints: ["src/jsx-runtime.ts", "src/index.ts", "src/nojsx.ts"],
	});
	await Bun.build({
		...shareConfig,
		root: "bundle",
		outdir: "bundle/out",
		splitting: true,
		entrypoints: ["bundle/index.js"],
	});
};

if (import.meta.main) {
	main();
}
