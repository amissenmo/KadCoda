import { useMemo, useState } from 'react';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { initiatePayment, validateDiscount } from '../services/checkoutApi';
import { faToEnDigits } from '../services/courseApi';

const defaultParsePrice = (price) => {
  if (typeof price === 'number') return price;
  if (price == null) return 0;
  const clean = faToEnDigits(String(price)).replace(/[^\d]/g, '');
  return Number(clean) || 0;
};

export function useCheckout(courseOrPricing, onClose, options = {}) {
  const parsePrice = options.parsePrice || defaultParsePrice;
  const pricing = courseOrPricing?.pricing || courseOrPricing || {};
  const courseId = courseOrPricing?.id || options.courseId || null;

  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountError, setDiscountError] = useState('');

  const basePrice = useMemo(
    () =>
      parsePrice(
        courseOrPricing?.original_price ??
          pricing.originalPrice ??
          pricing.finalPrice,
      ),
    [
      courseOrPricing?.original_price,
      parsePrice,
      pricing.finalPrice,
      pricing.originalPrice,
    ],
  );

  const baseDiscountAmount = useMemo(() => {
    const finalCoursePrice = parsePrice(
      courseOrPricing?.final_price ?? pricing.finalPrice,
    );
    return Math.max(basePrice - finalCoursePrice, 0);
  }, [basePrice, courseOrPricing?.final_price, parsePrice, pricing.finalPrice]);

  const appliedDiscountAmount = useMemo(() => {
    if (!appliedDiscount) return 0;
    if (typeof appliedDiscount.discount_amount === 'number') {
      return appliedDiscount.discount_amount;
    }
    const currentPrice = basePrice - baseDiscountAmount;
    return Math.round((currentPrice * (appliedDiscount.percent || 0)) / 100);
  }, [appliedDiscount, baseDiscountAmount, basePrice]);

  const finalPrice = useMemo(() => {
    if (appliedDiscount && typeof appliedDiscount.final_payable === 'number') {
      return appliedDiscount.final_payable;
    }
    return Math.max(basePrice - baseDiscountAmount - appliedDiscountAmount, 0);
  }, [appliedDiscount, appliedDiscountAmount, baseDiscountAmount, basePrice]);

  const validateDiscountMutation = useMutation({
    mutationFn: ({ targetCourseId, code }) =>
      validateDiscount(targetCourseId, code),
    onSuccess: (data) => {
      setAppliedDiscount({
        code: data.code,
        percent: data.percent,
        label: `${data.percent}٪ تخفیف`,
        discount_amount: data.discount_amount,
        final_payable: data.final_payable,
      });
      setDiscountError('');
      toast.success('کد تخفیف با موفقیت اعمال شد');
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'کد تخفیف نامعتبر یا منقضی شده است';
      setDiscountError(msg);
      toast.error(msg);
    },
  });

  const payMutation = useMutation({
    mutationFn: ({ targetCourseId, code }) =>
      initiatePayment(targetCourseId, code),
    onSuccess: (data) => {
      const redirectUrl = data?.redirect_url || data?.payment_url;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        toast.error('لینک انتقال به درگاه بانکی دریافت نشد');
      }
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'خطا در اتصال به درگاه پرداخت';
      toast.error(msg);
    },
  });

  const handleCodeChange = (value) => {
    setDiscountCode(value);
    setDiscountError('');
  };

  const handleApply = () => {
    const code = discountCode.trim().toUpperCase();
    if (!code) {
      setDiscountError('کد تخفیف را وارد کنید');
      return;
    }
    if (!courseId) {
      setDiscountError('شناسه دوره نامعتبر است');
      return;
    }
    validateDiscountMutation.mutate({ targetCourseId: courseId, code });
  };

  const handlePay = () => {
    if (!courseId) {
      toast.error('شناسه دوره جهت پرداخت یافت نشد');
      return;
    }
    payMutation.mutate({
      targetCourseId: courseId,
      code: appliedDiscount?.code || '',
    });
  };

  const handleRemove = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
    setDiscountError('');
  };

  const reset = () => {
    setDiscountCode('');
    setAppliedDiscount(null);
    setDiscountError('');
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  return {
    discountCode,
    appliedDiscount,
    discountError,
    basePrice,
    baseDiscountAmount,
    appliedDiscountAmount,
    finalPrice,
    isValidatingDiscount: validateDiscountMutation.isPending,
    isPaying: payMutation.isPending,
    handleCodeChange,
    handleApply,
    handlePay,
    handleRemove,
    handleClose,
  };
}
