import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
export const usePagination = (
  listData: any[],
  entitiesPerPage: number,
): [any[], number, number, (_: number) => void] => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState<number>(
    Number(searchParams.get("page")) ?? 1,
  );

  const setAndPersistPage = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    setSearchParams((prev) => {
      const newParams = prev;
      newParams.set("page", newPage.toString());
      return newParams;
    });
  }, []);
  const totalPages = useMemo(
    () => Math.ceil(listData?.length / entitiesPerPage),
    [listData.length, entitiesPerPage],
  );

  const pageEntities = useMemo(() => {
    const skip = (currentPage - 1) * entitiesPerPage;
    return listData?.slice(skip, skip + entitiesPerPage);
  }, [currentPage, listData]);

  useEffect(() => {
    if (currentPage <= 1 || currentPage > totalPages) setCurrentPage(1);
  }, [listData?.length, totalPages]);

  useEffect(() => {
    const paramsPage = searchParams.get("page")
      ? Number(searchParams.get("page"))
      : undefined;
    if (!paramsPage) {
      setCurrentPage(1);
    } else if (
      currentPage !== paramsPage &&
      paramsPage <= totalPages &&
      paramsPage >= 1
    ) {
      setCurrentPage(paramsPage);
    }
  }, [searchParams]);

  return [pageEntities, totalPages, currentPage, setAndPersistPage];
};

export const usePersistedTabs = (
  defaultTab: string,
): [string, (_: string) => void] => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<string>(searchParams.get("tab") ?? defaultTab);
  const setAndPersistTab = useCallback((newTab: string) => {
    setTab(newTab);
    setSearchParams((prev) => {
      const newParams = prev;
      newParams.set("tab", newTab);
      return newParams;
    });
  }, []);

  useEffect(() => {
    const paramsTab = searchParams.get("tab");
    if (!paramsTab) {
      setTab(defaultTab);
    }
    if (paramsTab && tab !== paramsTab) {
      setTab(paramsTab);
    }
  }, [searchParams]);

  return [tab, setAndPersistTab];
};

export const usePersistedSearchParam = (
  key: string,
  defaultValue: string,
): [string, (_: string) => void] => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [value, setValue] = useState<string>(
    searchParams.get(key) ?? defaultValue,
  );
  const setAndPersistValue = useCallback((newValue: string) => {
    setValue(newValue);
    setSearchParams((prev) => {
      const newParams = prev;
      newParams.set(key, newValue);
      return newParams;
    });
  }, []);

  useEffect(() => {
    const paramsValue = searchParams.get(key);
    if (!paramsValue) {
      setValue(defaultValue);
    }
    if (paramsValue && value !== paramsValue) {
      setValue(paramsValue);
    }
  }, [searchParams]);

  return [value, setAndPersistValue];
};

export const getTruncatedString = (str: string, maxLength: number) => {
  if (str.length > maxLength) {
    return `${str.slice(0, maxLength)}...`;
  }
  return str;
};

export const getObjectName = (key: string) => {
  const segments = key.split("/");
  if (segments.length === 0) {
    return key;
  }
  if (key.endsWith("/") && segments.length > 1) {
    return segments[segments.length - 2];
  }
  return segments[segments.length - 1];
};

export const getDisplayKey = (key: string) => {
  const drivePrefix = "sw-drive/";
  if (key.startsWith("sw-drive/")) {
    return key.substring(drivePrefix.length);
  }
  return key;
};
