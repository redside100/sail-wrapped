import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
export const usePagination = (
  listData: any[],
  entitiesPerPage: number
): [any[], number, number, (_: number) => void] => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState<number>(
    Number(searchParams.get("page")) ?? 1
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
    [listData.length, entitiesPerPage]
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
  defaultTab: string
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

export const getTruncatedString = (str: string, maxLength: number) => {
  if (str.length > maxLength) {
    return `${str.slice(0, maxLength)}...`;
  }
  return str;
};
