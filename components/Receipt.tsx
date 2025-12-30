
import React from 'react';
import { Sale, CartItem } from '../types';
import { Dog, Printer, X, Truck, Tag } from 'lucide-react';

interface ReceiptProps {
  sale: Sale;
  onClose?: () => void;
}

const Receipt: React.FC<ReceiptProps> = ({ sale, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const getItemDiscountedTotal = (item: CartItem) => {
    const baseTotal = item.price * item.quantity;
    if (!item.discountValue || item.discountValue <= 0) return baseTotal;
    if (item.discountType === 'percent') {
      return baseTotal * (1 - item.discountValue / 100);
    } else {
      return Math.max(0, baseTotal - item.discountValue);
    }
  };

  return (
    <div className="bg-white p-8 max-w-sm mx-auto shadow-2xl border border-slate-200 rounded-sm relative print:shadow-none print:border-none print:p-0">
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-white bg-white/10 hover:bg-white/20 rounded-full transition-all print:hidden"
        >
          <X className="w-6 h-6" />
        </button>
      )}

      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-600 text-white rounded-full mb-2">
          <Dog className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">PawPrint Pet Store</h2>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Premium Retail Experience</p>
        <p className="text-xs text-slate-400 mt-1">123 Pet Lane, Animal City</p>
        <p className="text-xs text-slate-400">(555) 123-4567</p>
      </div>

      <div className="border-t border-b border-dashed border-slate-200 py-3 my-4 space-y-1">
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>RECEIPT #:</span>
          <span className="font-mono">{sale.id.toUpperCase()}</span>
        </div>
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>DATE:</span>
          <span>{new Date(sale.timestamp).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>PAYMENT:</span>
          <span className="font-bold">{sale.paymentMethod}</span>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="grid grid-cols-4 text-[10px] font-bold text-slate-400 border-b border-slate-100 pb-2">
          <span className="col-span-2">ITEM</span>
          <span className="text-center">QTY</span>
          <span className="text-right">PRICE</span>
        </div>
        {sale.items.map((item, idx) => {
          const itemTotal = getItemDiscountedTotal(item);
          const itemBaseTotal = item.price * item.quantity;
          const discount = itemBaseTotal - itemTotal;

          return (
            <div key={idx} className="flex flex-col gap-0.5 border-b border-slate-50 pb-1">
              <div className="grid grid-cols-4 text-xs text-slate-700">
                <span className="col-span-2 leading-tight">{item.name}</span>
                <span className="text-center text-slate-400">x{item.quantity}</span>
                <span className="text-right font-medium">${itemBaseTotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[10px] text-amber-600 font-bold italic ml-2">
                  <span>- Item Discount ({item.discountType === 'percent' ? `${item.discountValue}%` : `$${item.discountValue}`})</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-100 pt-4 space-y-1.5">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Subtotal</span>
          <span>${sale.subtotal.toFixed(2)}</span>
        </div>
        {sale.totalDiscount > 0 && (
          <div className="flex justify-between text-xs text-amber-600 font-medium">
            <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> Total Discount</span>
            <span>-${sale.totalDiscount.toFixed(2)}</span>
          </div>
        )}
        {sale.deliveryFee > 0 && (
          <div className="flex justify-between text-xs text-teal-600 font-medium">
            <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Delivery Fee</span>
            <span>+${sale.deliveryFee.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-black text-slate-900 pt-2 border-t border-slate-50">
          <span>TOTAL</span>
          <span>${sale.total.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-dashed border-slate-200 text-center">
        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Thank you for shopping!</p>
        <p className="text-[10px] text-slate-400">All sales are final.</p>
        
        <div className="mt-6 flex flex-col gap-2 print:hidden">
          <button 
            onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
