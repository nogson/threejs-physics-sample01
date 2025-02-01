import { defineConfig } from "vite";

export default defineConfig({
  base: "threejs-physics-sample01/", // リポジトリ名を指定
  build: {
    outDir: "docs", // ビルド出力ディレクトリを 'docs' に設定
  },
});
