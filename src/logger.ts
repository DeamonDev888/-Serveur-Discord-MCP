import { logger } from "./utils/logger.js";

export { logger };
export const discordLogger = logger.child({ module: "DISCORD" });
export const serverLogger  = logger.child({ module: "SERVER" });
export const toolLogger    = logger.child({ module: "TOOL" });
export const bridgeLogger  = logger.child({ module: "BRIDGE" });

export default logger;
