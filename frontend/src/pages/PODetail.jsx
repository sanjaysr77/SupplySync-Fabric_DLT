import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Alert } from '../components/common';
import { MainLayout } from '../components/layout';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export function PODetail() {
  const { poId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [po, setPo] = useState(null);
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDispatchForm, setShowDispatchForm] = useState(false);
  const [dispatchDate, setDispatchDate] = useState('');

  useEffect(() => {
    fetchPODetails();
  }, [poId]);

  const fetchPODetails = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await api.get(`/po/${poId}`);
      const poData = response.data.purchaseOrder;
      setPo(poData);

      // Fetch product details if available
      if (poData.productId) {
        try {
          const productRes = await api.get(`/product/${poData.productId}`);
          setProduct(productRes.data.product);
        } catch (err) {
          console.log('Could not fetch product details');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch PO details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovePO = async () => {
    try {
      await api.put(`/po/${poId}/approve`);
      setSuccess('Purchase order approved successfully');
      setTimeout(() => fetchPODetails(), 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve PO');
    }
  };

  const handleRejectPO = async () => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      await api.put(`/po/${poId}/reject`, { reason });
      setSuccess('Purchase order rejected successfully');
      setTimeout(() => fetchPODetails(), 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject PO');
    }
  };

  const handleMarkDispatch = async (e) => {
    e.preventDefault();
    if (!dispatchDate) {
      setError('Please select a dispatch date');
      return;
    }

    try {
      await api.put(`/po/${poId}/status`, { dispatchDate });
      setSuccess('Dispatch marked successfully');
      setShowDispatchForm(false);
      setDispatchDate('');
      setTimeout(() => fetchPODetails(), 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark dispatch');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'PENDING_PRODUCER_RESPONSE': 'bg-yellow-100 text-yellow-800',
      'ACCEPTED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'DISPATCHED': 'bg-blue-100 text-blue-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'completed': 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const canApprove = po && (po.status === 'PENDING_PRODUCER_RESPONSE' || po.status === 'pending');
  const canReject = po && (po.status === 'PENDING_PRODUCER_RESPONSE' || po.status === 'pending');
  const canDispatch = po && (po.status === 'ACCEPTED' || po.status === 'approved');

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-8">
          <p className="text-gray-600">Loading PO details...</p>
        </div>
      </MainLayout>
    );
  }

  if (!po) {
    return (
      <MainLayout>
        <div className="p-8">
          <Alert type="error" message="PO not found" />
          <Button variant="secondary" onClick={() => navigate('/purchase-orders')} className="mt-4">
            Back to POs
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{po.poId}</h1>
              <p className="text-gray-600 mt-2">Purchase Order Details</p>
            </div>
            <Button variant="secondary" onClick={() => navigate('/purchase-orders')}>
              Back to List
            </Button>
          </div>

          {error && (
            <Alert type="error" message={error} onClose={() => setError('')} />
          )}

          {success && (
            <Alert type="success" message={success} onClose={() => setSuccess('')} />
          )}

          {/* Status Section */}
          <Card className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Status</p>
                <span className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold mt-2 ${getStatusColor(po.status)}`}>
                  {po.status || 'Unknown'}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600">Created</p>
                <p className="text-gray-900 font-semibold mt-1">
                  {po.createdAt ? new Date(po.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </Card>

          {/* Main Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Left Column */}
            <Card>
              <h3 className="text-lg font-bold text-gray-900 mb-6">Order Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">PO ID</p>
                  <p className="text-gray-900 font-mono mt-1">{po.poId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Quantity</p>
                  <p className="text-gray-900 font-semibold mt-1">{po.quantity || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Requested Delivery Date</p>
                  <p className="text-gray-900 mt-1">
                    {po.requestedDeliveryDate ? new Date(po.requestedDeliveryDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                {po.linkedRetailerPOId && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Linked Retailer PO</p>
                    <p className="text-gray-900 font-mono mt-1">{po.linkedRetailerPOId}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Right Column */}
            <Card>
              <h3 className="text-lg font-bold text-gray-900 mb-6">Product Information</h3>
              {product ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Product Name</p>
                    <p className="text-gray-900 font-semibold mt-1">{product.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">SKU</p>
                    <p className="text-gray-900 font-mono mt-1">{product.sku}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Price</p>
                    <p className="text-gray-900 font-semibold mt-1">${product.price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Category</p>
                    <p className="text-gray-900 mt-1">{product.category || 'N/A'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">Product details not available</p>
              )}
            </Card>
          </div>

          {/* Notes Section */}
          {po.notes && (
            <Card className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Notes</h3>
              <p className="text-gray-700">{po.notes}</p>
            </Card>
          )}

          {/* Actions Section */}
          <Card>
            <h3 className="text-lg font-bold text-gray-900 mb-6">Actions</h3>
            
            {canApprove && (
              <div className="flex gap-4 mb-6">
                <Button variant="primary" onClick={handleApprovePO}>
                  Approve PO
                </Button>
                <Button variant="danger" onClick={handleRejectPO}>
                  Reject PO
                </Button>
              </div>
            )}

            {canDispatch && (
              <div className="mb-6">
                {!showDispatchForm ? (
                  <Button variant="primary" onClick={() => setShowDispatchForm(true)}>
                    Mark Dispatch
                  </Button>
                ) : (
                  <form onSubmit={handleMarkDispatch} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dispatch Date
                      </label>
                      <input
                        type="date"
                        value={dispatchDate}
                        onChange={(e) => setDispatchDate(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex gap-4">
                      <Button type="submit" variant="primary">
                        Confirm Dispatch
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setShowDispatchForm(false);
                          setDispatchDate('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {!canApprove && !canReject && !canDispatch && (
              <p className="text-gray-600">No actions available for this PO status</p>
            )}
          </Card>

          {/* Timeline */}
          <Card className="mt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Timeline</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-semibold text-gray-900">PO Created</p>
                  <p className="text-sm text-gray-600">
                    {po.createdAt ? new Date(po.createdAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
              {po.updatedAt && po.updatedAt !== po.createdAt && (
                <div className="flex gap-4">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-semibold text-gray-900">Last Updated</p>
                    <p className="text-sm text-gray-600">{new Date(po.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
