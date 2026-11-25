abstract class List {
  static merge = <T extends { id?: number }>(
    ...lists: Array<ReadonlyArray<T> | undefined>
  ): T[] => {
    const result: T[] = [];
    lists.forEach((list) => {
      list?.forEach((item) => {
        if (item == null) return;
        const hasId = item.id !== undefined && item.id !== null;
        const existsByRef = result.includes(item);
        const existsById = hasId && result.some(it => it != null && it.id === item.id);
        if (!existsByRef && !existsById) {
          result.push(item);
        }
      });
    });

    return result;
  }

  static safeMerge = <T extends readonly unknown[]>(
    ...lists: { [K in keyof T]: ReadonlyArray<T[K]> | null }
  ): Array<T[number]> => {
    const result: Array<T[number]> = [];
    lists.filter(Boolean).forEach((list) => {
      if (list == null) return;
      list.forEach((item) => {
        if (item == null) return;
        if (!(result as Array<T[number]>).includes(item as T[number]))
          result.push(item as T[number]);
      });
    });
    return result;
  }

  static bool = (...items: boolean[]): boolean =>
    items.every(it => it);

  static deduplicate = <T>(list: T[]) =>
    list.filter((value, index, self) => self.indexOf(value) === index);
}

export default List;