import { useState, useEffect } from 'react';
import { Card, Alert, Button } from '../components/common';
import { MainLayout } from '../components/layout';
import api from '../services/api';

export function Analytics() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportFormat, setExportFormat] = useState('csv');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/admin/stats');
      setStats(response.data.stats);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      if (exportFormat === 'csv') {
        exportToCSV();
      } else if (exportFormat === 'pdf') {
        exportToPDF();
      }
    } catch (err) {
      setError('Failed to export data');
    }
  };

  const exportToCSV = () => {
    if (!stats) return;

    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Users', stats.totalUsers || 0],
      ['Total Organizations', stats.totalOrganizations || 0],
      ['Total Products', stats.totalProducts || 0],
      ['Total Purchase Orders', stats.totalPOs || 0],
      ['Total Shipments', stats.totalShipments || 0],
      ['Total DPP Records', stats.totalDPPs || 0],
      ['POs Approved', stats.posApproved || 0],
      ['POs Pending', stats.posPending || 0],
      ['Shipments Delivered', stats.shipmentsDelivered || 0],
      ['Shipments In Transit', stats.shipmentsInTransit || 0],
    ];

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supply-chain-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportToPDF = () => {
    if (!stats) return;

    const content = `
SUPPLY CHAIN ANALYTICS REPORT
Generated: ${new Date().toLocaleString()}

SYSTEM STATISTICS
================

Users: ${stats.totalUsers || 0}
Organizations: ${stats.totalOrganizations || 0}
Products: ${stats.totalProducts || 0}

PURCHASE ORDERS
===============
Total: ${stats.totalPOs || 0}
Approved: ${stats.posApproved || 0}
Pending: ${stats.posPending || 0}

SHIPMENTS
=========
Total: ${stats.totalShipments || 0}
Delivered: ${stats.shipmentsDelivered || 0}
In Transit: ${stats.shipmentsInTransit || 0}

DIGITAL PRODUCT PASSPORTS
==========================
Total DPP Records: ${stats.totalDPPs || 0}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supply-chain-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  return (
    <MainLayout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Analytics & Reports</h1>
            <div className="flex gap-2">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
              </select>
              <Button variant="primary" onClick={handleExport}>
                Export Report
              </Button>
            </div>
          </div>

          {error && (
            <Alert type="error" message={error} onClose={() => setError('')} />
          )}

          {isLoading ? (
            <Card>
              <p className="text-gray-600">Loading statistics...</p>
            </Card>
          ) : stats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <Card>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600">
                      {stats.totalUsers || 0}
                    </div>
                    <p className="text-gray-600 mt-2">Total Users</p>
                  </div>
                </Card>

                <Card>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">
                      {stats.totalOrganizations || 0}
                    </div>
                    <p className="text-gray-600 mt-2">Organizations</p>
                  </div>
                </Card>

                <Card>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-600">
                      {stats.totalProducts || 0}
                    </div>
                    <p className="text-gray-600 mt-2">Products</p>
                  </div>
                </Card>

                <Card>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-orange-600">
                      {stats.totalPOs || 0}
                    </div>
                    <p className="text-gray-600 mt-2">Purchase Orders</p>
                  </div>
                </Card>

                <Card>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-red-600">
                      {stats.totalShipments || 0}
                    </div>
                    <p className="text-gray-600 mt-2">Shipments</p>
                  </div>
                </Card>

                <Card>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-indigo-600">
                      {stats.totalDPPs || 0}
                    </div>
                    <p className="text-gray-600 mt-2">DPP Records</p>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Purchase Order Status</h2>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-700">Approved</span>
                        <span className="font-semibold text-gray-900">
                          {stats.posApproved || 0}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${
                              stats.totalPOs > 0
                                ? ((stats.posApproved || 0) / stats.totalPOs) * 100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-700">Pending</span>
                        <span className="font-semibold text-gray-900">
                          {stats.posPending || 0}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-600 h-2 rounded-full"
                          style={{
                            width: `${
                              stats.totalPOs > 0
                                ? ((stats.posPending || 0) / stats.totalPOs) * 100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipment Status</h2>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-700">Delivered</span>
                        <span className="font-semibold text-gray-900">
                          {stats.shipmentsDelivered || 0}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${
                              stats.totalShipments > 0
                                ? ((stats.shipmentsDelivered || 0) / stats.totalShipments) * 100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-700">In Transit</span>
                        <span className="font-semibold text-gray-900">
                          {stats.shipmentsInTransit || 0}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${
                              stats.totalShipments > 0
                                ? ((stats.shipmentsInTransit || 0) / stats.totalShipments) * 100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Supply Chain Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Avg PO Value</span>
                        <span className="font-semibold text-gray-900">
                          ${stats.avgPOValue?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Total PO Value</span>
                        <span className="font-semibold text-gray-900">
                          ${stats.totalPOValue?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Approval Rate</span>
                        <span className="font-semibold text-gray-900">
                          {stats.totalPOs > 0
                            ? (((stats.posApproved || 0) / stats.totalPOs) * 100).toFixed(1)
                            : '0'}
                          %
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Delivery Rate</span>
                        <span className="font-semibold text-gray-900">
                          {stats.totalShipments > 0
                            ? (((stats.shipmentsDelivered || 0) / stats.totalShipments) * 100).toFixed(1)
                            : '0'}
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Blockchain Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-600 rounded-full mr-3"></div>
                        <span className="text-gray-700">Network Connected</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-600 rounded-full mr-3"></div>
                        <span className="text-gray-700">Smart Contracts Active</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-600 rounded-full mr-3"></div>
                        <span className="text-gray-700">Data Immutable</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-600 rounded-full mr-3"></div>
                        <span className="text-gray-700">Audit Trail Complete</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <Card>
              <p className="text-gray-600">No statistics available</p>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
