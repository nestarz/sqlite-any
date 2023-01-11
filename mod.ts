import { Sqlite } from "./vfs.ts";

export default async (
  get: (arg: number) => Array<number> | undefined,
  set: (arg: number, buffer: Array<number>) => Promise<void>,
  remove: (arg: number) => Promise<void>
) => {
  const state = { pageCount: 0 };
  const page: Array<number> | undefined = await get(0);
  if (page) {
    const view = new DataView(new Uint8Array(page).buffer);
    state.pageCount = view.getUint32(28, false);
  }
  return await Sqlite.instantiate({
    pageCount(): number {
      return state.pageCount;
    },
    async getPage(ix: number): Promise<Uint8Array> {
      const page = new Uint8Array((await get(ix)) ?? new Uint8Array(4096));
      return page;
    },
    async putPage(ix: number, page: Uint8Array): Promise<void> {
      await set(ix, Array.from(page));
      state.pageCount = Math.max(state.pageCount, ix + 1);
    },
    async delPage(ix: number): Promise<void> {
      await remove(ix);
      if (ix + 1 >= state.pageCount) {
        state.pageCount = ix;
      }
    },
  });
};
