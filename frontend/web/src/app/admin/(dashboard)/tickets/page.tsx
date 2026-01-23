'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Plane, Loader2, Search, 
  ArrowUpDown, ArrowUp, ArrowDown, Trash2,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { getAllTickets, deleteTicket } from '@/lib/services/admin/tickets';
import type { AirlineTicket } from '@unik/shared/types';
import Link from 'next/link';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState,
  PaginationState,
} from '@tanstack/react-table';

const AIRLINE_LABELS: Record<string, string> = {
  'JIN': 'JIN Air',
  'JEJU': 'JEJU Air',
  'AIRBUSAN': 'Air Busan',
  'BX': 'Air Busan',
  '5J': 'Cebu Pacific',
};

const AIRLINE_COLORS: Record<string, string> = {
  'JIN': 'bg-purple-100 text-purple-800 border-purple-200',
  'JEJU': 'bg-orange-100 text-orange-800 border-orange-200',
  'AIRBUSAN': 'bg-blue-100 text-blue-800 border-blue-200',
  'BX': 'bg-blue-100 text-blue-800 border-blue-200',
  '5J': 'bg-green-100 text-green-800 border-green-200',
};

// Tour status calculation function
function getTourStatus(ticket: AirlineTicket): { status: string; color: string } {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (!ticket.journeys || ticket.journeys.length === 0) {
    return { status: 'No Info', color: 'bg-gray-100 text-gray-800' };
  }

  const parseDate = (dateStr: string) => {
    // Parse "20 DEC 2025" format
    const months: Record<string, number> = {
      'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
      'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
    };
    const parts = dateStr.trim().split(' ');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = months[parts[1].toUpperCase()];
      const year = parseInt(parts[2]);
      return new Date(year, month, day);
    }
    return null;
  };

  const journeys = ticket.journeys;
  const firstDepartureDate = parseDate(journeys[0].departureDate);
  const lastArrivalDate = parseDate(journeys[journeys.length - 1].arrivalDate);

  if (!firstDepartureDate || !lastArrivalDate) {
    return { status: 'No Info', color: 'bg-gray-100 text-gray-800' };
  }

  if (ticket.journeyType === 'one-way') {
    // One-way: based on departure date
    if (now >= firstDepartureDate) {
      return { status: 'Completed', color: 'bg-green-100 text-green-800' };
    } else {
      return { status: 'Upcoming', color: 'bg-blue-100 text-blue-800' };
    }
  } else if (ticket.journeyType === 'round-trip') {
    // Round-trip: outbound and inbound
    if (journeys.length >= 2) {
      const returnDepartureDate = parseDate(journeys[1].departureDate);
      
      if (!returnDepartureDate) {
        return { status: 'No Info', color: 'bg-gray-100 text-gray-800' };
      }

      if (now >= lastArrivalDate) {
        return { status: 'Completed', color: 'bg-green-100 text-green-800' };
      } else if (now >= returnDepartureDate) {
        return { status: 'Returning', color: 'bg-yellow-100 text-yellow-800' };
      } else if (now >= firstDepartureDate) {
        return { status: 'In Progress', color: 'bg-orange-100 text-orange-800' };
      } else {
        return { status: 'Upcoming', color: 'bg-blue-100 text-blue-800' };
      }
    }
  } else if (ticket.journeyType === 'multi-city') {
    // Multi-city
    let completedLegs = 0;
    for (const journey of journeys) {
      const depDate = parseDate(journey.departureDate);
      if (depDate && now >= depDate) {
        completedLegs++;
      }
    }

    if (completedLegs === 0) {
      return { status: 'Upcoming', color: 'bg-blue-100 text-blue-800' };
    } else if (completedLegs === journeys.length) {
      return { status: 'Completed', color: 'bg-green-100 text-green-800' };
    } else {
      return { status: `${completedLegs} Legs Done`, color: 'bg-orange-100 text-orange-800' };
    }
  }

  return { status: 'No Info', color: 'bg-gray-100 text-gray-800' };
}

const columnHelper = createColumnHelper<AirlineTicket>();

export default function TicketsListPage() {
  const [tickets, setTickets] = useState<AirlineTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  
  // 검색 필터
  const [passengerNameFilter, setPassengerNameFilter] = useState('');
  const [departureFilter, setDepartureFilter] = useState('');
  const [returnFilter, setReturnFilter] = useState('');
  const [airlineFilter, setAirlineFilter] = useState('');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const data = await getAllTickets();
      setTickets(data);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteTicket(id);
      // 로컬 상태 업데이트
      setTickets(prevTickets => prevTickets.filter(t => t.id !== id));
      alert('Ticket deleted successfully.');
    } catch (error) {
      console.error('Error deleting ticket:', error);
      alert('Failed to delete ticket.');
    }
  };

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    return tickets.filter(ticket => {
      // 승객명 필터
      if (passengerNameFilter) {
        const hasMatchingPassenger = ticket.passengers?.some(p => 
          `${p.lastName} ${p.firstName}`.toLowerCase().includes(passengerNameFilter.toLowerCase())
        );
        if (!hasMatchingPassenger) return false;
      }

      // 항공사 필터
      if (airlineFilter && ticket.airline !== airlineFilter) {
        return false;
      }

      // 출발일 필터
      if (departureFilter && ticket.journeys?.[0]) {
        if (!ticket.journeys[0].departureDate.toLowerCase().includes(departureFilter.toLowerCase())) {
          return false;
        }
      }

      // 리턴일 필터 (왕복일 경우만)
      if (returnFilter && ticket.journeys?.[1]) {
        if (!ticket.journeys[1].departureDate.toLowerCase().includes(returnFilter.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [tickets, passengerNameFilter, airlineFilter, departureFilter, returnFilter]);

  const columns = useMemo(() => [
    columnHelper.display({
      id: 'index',
      header: 'No.',
      cell: (info) => (
        <div className="text-center text-sm text-slate-600">
          {info.row.index + 1}
        </div>
      ),
      size: 60,
    }),
    columnHelper.accessor('airline', {
      header: 'Airline',
      cell: (info) => (
        <span className={`text-xs font-medium px-2 py-1 rounded border ${AIRLINE_COLORS[info.getValue()]}`}>
          {AIRLINE_LABELS[info.getValue()]}
        </span>
      ),
      size: 120,
    }),
    columnHelper.accessor('journeyType', {
      header: 'Journey Type',
      cell: (info) => {
        const typeMap: Record<string, { label: string; color: string }> = {
          'one-way': { label: 'One-way', color: 'bg-blue-50 text-blue-700 border-blue-200' },
          'round-trip': { label: 'Round-trip', color: 'bg-green-50 text-green-700 border-green-200' },
          'multi-city': { label: 'Multi-city', color: 'bg-purple-50 text-purple-700 border-purple-200' },
        };
        const type = typeMap[info.getValue()] || { label: info.getValue(), color: 'bg-gray-50 text-gray-700 border-gray-200' };
        return (
          <span className={`text-xs font-medium px-2 py-1 rounded border ${type.color}`}>
            {type.label}
          </span>
        );
      },
      size: 100,
    }),
    columnHelper.accessor((row) => row.journeys?.[0]?.departureDate || '', {
      id: 'departureDate',
      header: 'Departure',
      cell: (info) => (
        <div className="text-sm text-slate-700">
          {info.getValue()}
        </div>
      ),
      size: 120,
    }),
    columnHelper.accessor((row) => row.journeys?.[1]?.departureDate || '-', {
      id: 'returnDate',
      header: 'Return',
      cell: (info) => (
        <div className="text-sm text-slate-700">
          {info.getValue()}
        </div>
      ),
      size: 120,
    }),
    columnHelper.accessor((row) => row.passengers?.length || 0, {
      id: 'passengerCount',
      header: 'Passengers',
      cell: (info) => (
        <div className="text-center text-sm text-slate-700">
          {info.getValue()} pax
        </div>
      ),
      size: 80,
    }),
    columnHelper.accessor('reservationNumber', {
      header: 'Booking',
      cell: (info) => (
        <div className="text-sm font-semibold text-slate-900">
          {info.getValue()}
        </div>
      ),
      size: 120,
    }),
    columnHelper.accessor((row) => {
      const j = row.journeys?.[0];
      return j ? `${j.departureAirportCode} → ${j.arrivalAirportCode}` : '-';
    }, {
      id: 'outbound',
      header: 'Outbound',
      cell: (info) => (
        <div className="text-sm text-slate-700">
          {info.getValue()}
        </div>
      ),
      size: 150,
    }),
    columnHelper.accessor((row) => {
      const j = row.journeys?.[1];
      return j ? `${j.departureAirportCode} → ${j.arrivalAirportCode}` : '-';
    }, {
      id: 'inbound',
      header: 'Inbound',
      cell: (info) => (
        <div className="text-sm text-slate-700">
          {info.getValue()}
        </div>
      ),
      size: 150,
    }),
    columnHelper.display({
      id: 'status',
      header: 'Tour Status',
      cell: (info) => {
        const { status, color } = getTourStatus(info.row.original);
        return (
          <span className={`text-xs font-medium px-2 py-1 rounded ${color}`}>
            {status}
          </span>
        );
      },
      size: 120,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => (
        <div className="flex items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(info.row.original.id);
            }}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      size: 80,
    }),
  ], []);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Airline Ticket Management</h1>
          <p className="text-slate-500 mt-1">Create and manage airline tickets</p>
        </div>
        <Link href="/admin/tickets/new" className="admin-btn-primary">
          <Plus className="w-4 h-4" />
          Create New Ticket
        </Link>
      </div>

      {/* Search Filters */}
      <div className="admin-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-slate-400" />
          <h3 className="font-semibold text-slate-700">Search Filters</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Passenger Name
            </label>
            <input
              type="text"
              placeholder="Search by name..."
              value={passengerNameFilter}
              onChange={(e) => setPassengerNameFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Departure Date
            </label>
            <input
              type="text"
              placeholder="e.g. 20 DEC 2025"
              value={departureFilter}
              onChange={(e) => setDepartureFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Return Date
            </label>
            <input
              type="text"
              placeholder="e.g. 24 DEC 2025"
              value={returnFilter}
              onChange={(e) => setReturnFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Airline
            </label>
            <select
              value={airlineFilter}
              onChange={(e) => setAirlineFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900"
            >
              <option value="">All</option>
              <option value="JIN">JIN Air</option>
              <option value="JEJU">JEJU Air</option>
              <option value="AIRBUSAN">Air Busan</option>
              <option value="5J">Cebu Pacific</option>
            </select>
          </div>
        </div>
        {(passengerNameFilter || departureFilter || returnFilter || airlineFilter) && (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => {
                setPassengerNameFilter('');
                setDepartureFilter('');
                setReturnFilter('');
                setAirlineFilter('');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear Filters
            </button>
            <span className="text-sm text-slate-500">
              ({filteredData.length} items)
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      {filteredData.length === 0 ? (
        <div className="admin-card p-12 text-center">
          <Plane className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {tickets.length === 0 ? 'No tickets found' : 'No search results'}
          </h3>
          <p className="text-slate-500 mb-6">
            {tickets.length === 0 
              ? 'Create your first airline ticket.' 
              : 'Try different search criteria.'}
          </p>
          {tickets.length === 0 && (
            <Link href="/admin/tickets/new" className="admin-btn-primary inline-flex">
              <Plus className="w-4 h-4" />
              Create Ticket
            </Link>
          )}
        </div>
      ) : (
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider"
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={`flex items-center gap-2 ${
                              header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                            }`}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {header.column.getCanSort() && (
                              <span className="text-slate-400">
                                {{
                                  asc: <ArrowUp className="w-4 h-4" />,
                                  desc: <ArrowDown className="w-4 h-4" />,
                                }[header.column.getIsSorted() as string] ?? (
                                  <ArrowUpDown className="w-4 h-4" />
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-200">
                {table.getRowModel().rows.map(row => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={(e) => {
                      // 액션 버튼 클릭시 제외
                      if ((e.target as HTMLElement).closest('button, a')) return;
                      const airlineRoutes: Record<string, string> = {
                        'JIN': 'jin',
                        'JEJU': 'jeju',
                        '5J': 'cebu',
                        'BX': 'airbusan',
                        'AIRBUSAN': 'airbusan'
                      };
                      const airlineRoute = airlineRoutes[row.original.airline] || row.original.airline.toLowerCase();
                      window.location.href = `/admin/tickets/${airlineRoute}/${row.original.id}`;
                    }}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-4 py-4 whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm text-slate-600">
                Total <span className="font-semibold text-slate-900">{filteredData.length}</span> tickets
              </p>
              <span className="text-slate-400">|</span>
              <p className="text-sm text-slate-600">
                Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} - {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, filteredData.length)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Page size selection */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-600">Per page</label>
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={e => {
                    table.setPageSize(Number(e.target.value));
                  }}
                  className="px-2 py-1 border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[10, 20, 30, 50, 100].map(pageSize => (
                    <option key={pageSize} value={pageSize}>
                      {pageSize}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-slate-400">|</span>

              {/* Page number */}
              <span className="text-sm text-slate-600">
                Page <span className="font-semibold text-slate-900">{table.getState().pagination.pageIndex + 1}</span> of {table.getPageCount()}
              </span>

              <span className="text-slate-400">|</span>

              {/* Page navigation buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="First page"
                >
                  <ChevronsLeft className="w-4 h-4 text-slate-600" />
                </button>
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
                <button
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Last page"
                >
                  <ChevronsRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              <span className="text-slate-400">|</span>

              {/* Direct page input */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-600">Go to</label>
                <input
                  type="number"
                  min="1"
                  max={table.getPageCount()}
                  defaultValue={table.getState().pagination.pageIndex + 1}
                  onChange={e => {
                    const page = e.target.value ? Number(e.target.value) - 1 : 0;
                    table.setPageIndex(page);
                  }}
                  className="w-16 px-2 py-1 border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
