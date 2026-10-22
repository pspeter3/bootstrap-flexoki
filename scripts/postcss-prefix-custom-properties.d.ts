declare module "postcss-prefix-custom-properties" {
  import type { PluginCreator } from "postcss";

  const plugin: PluginCreator<{ prefix: string }>;
  export default plugin;
}
