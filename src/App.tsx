import { useEffect, useState, useCallback, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Checkbox } from "primereact/checkbox";
import InputOverlay from "./ImageOverlay";
import axios from "axios";
import "./App.css";

interface Artwork {
  id: number;
  title: string;
  artist_title: string;
  place_of_origin?: string;
  inscriptions?: string;
  date_start?: number;
  date_end?: number;
}

function App() {
  const [pagesCache, setPagesCache] = useState<Map<number, Artwork[]>>(new Map());
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [first, setFirst] = useState(0);
  const [selectCount, setSelectCount] = useState(0);
  const [version, setVersion] = useState(0); // Force rerender
  const rows = 12;

  const triggeredByInput = useRef(false);

  const fetchPage = useCallback(
    async (page: number) => {
      if (pagesCache.has(page)) return pagesCache.get(page)!;

      setLoading(true);
      const response = await axios.get(
        `https://api.artic.edu/api/v1/artworks?page=${page}&limit=${rows}`
      );

      const artworks = response.data.data.map((item: any) => ({
        id: item.id,
        title: item.title,
        artist_title: item.artist_title,
        place_of_origin: item.place_of_origin,
        inscriptions: item.inscriptions,
        date_start: item.date_start,
        date_end: item.date_end,
      }));

      setPagesCache((prev) => new Map(prev).set(page, artworks));
      setTotalRecords(response.data.pagination.total);
      setLoading(false);
      return artworks;
    },
    [pagesCache]
  );

  const loadPage = useCallback(
    async (page: number) => {
      const artworks = await fetchPage(page);
      const pageStartIndex = (page - 1) * rows + 1;

      setSelectedIds((prevSelected) => {
        const newSelected = new Set(prevSelected);
        artworks.forEach((artwork, index) => {
          const globalIndex = pageStartIndex + index;
          if (globalIndex <= selectCount) newSelected.add(artwork.id);
          else newSelected.delete(artwork.id);
        });
        return newSelected;
      });
    },
    [fetchPage, selectCount, rows]
  );

  useEffect(() => {
    if (!triggeredByInput.current) {
      loadPage(1);
    }
  }, [loadPage]);

  useEffect(() => {
    triggeredByInput.current = false;
  }, [first]);

  const onPageChange = (event: any) => {
    const page = event.page + 1;
    setFirst(event.first);
    loadPage(page);
  };

  const handleSelectRowCount = async (count: number) => {
    if (count < 0) count = 0;
    if (count > totalRecords) count = totalRecords;

    triggeredByInput.current = true;
    setSelectCount(count);
    setFirst(0); // reset to first page
    await loadPage(1); // reload data for page 1
    setVersion((v) => v + 1); // force rerender
  };

  const currentPage = first / rows + 1;
  const data = pagesCache.get(currentPage) || [];

  const isRowSelected = (row: Artwork) => selectedIds.has(row.id);

  const toggleRowSelection = (row: Artwork, checked: boolean) => {
    setSelectedIds((prev) => {
      const newSelected = new Set(prev);
      if (checked) newSelected.add(row.id);
      else newSelected.delete(row.id);
      return newSelected;
    });
  };

  return (
    <div className="app">
      <h2>PrimeReact Artwork Table</h2>
      <InputOverlay onSubmit={handleSelectRowCount} />

      <DataTable
        key={version}
        value={data}
        paginator
        first={first}
        rows={rows}
        totalRecords={totalRecords}
        lazy
        loading={loading}
        dataKey="id"
        selection={data.filter((item) => selectedIds.has(item.id))}
        onSelectionChange={(e) => {
          const newSelectedIds = new Set(selectedIds);
          e.value.forEach((item: Artwork) => {
            newSelectedIds.add(item.id);
          });
          data.forEach((item) => {
            if (!e.value.some((sel: Artwork) => sel.id === item.id)) {
              newSelectedIds.delete(item.id);
            }
          });
          setSelectedIds(newSelectedIds);
        }}
        onPage={onPageChange}
      >
        <Column
          selectionMode="multiple"
          headerStyle={{ width: "3em" }}
          body={(rowData: Artwork) => (
            <Checkbox
              key={rowData.id}
              checked={isRowSelected(rowData)}
              onChange={(e) => toggleRowSelection(rowData, e.checked!)}
            />
          )}
        />
        <Column field="id" header="ID" />
        <Column field="title" header="Title" />
        <Column field="artist_title" header="Artist" />
        <Column field="place_of_origin" header="Place Of Origin" />
        <Column field="inscriptions" header="Inscriptions" />
        <Column field="date_start" header="Date Start" />
        <Column field="date_end" header="Date End" />
      </DataTable>
    </div>
  );
}

export default App;
