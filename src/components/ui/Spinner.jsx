import { motion } from 'framer-motion';

import { cn } from '../../lib/utils';

export default function Spinner({ className }) {
  return (
    <motion.span
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      className={cn(
        'h-16 w-16 rounded-full border-2 border-white/40 border-t-white',
        className,
      )}
    />
  );
}
