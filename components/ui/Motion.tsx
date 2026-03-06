'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export const MotionList = ({ 
  children, 
  className,
  delay = 0
}: { 
  children: ReactNode; 
  className?: string;
  delay?: number;
}) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
            delayChildren: delay,
          }
        }
      }}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const MotionItem = ({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string; 
}) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 50, damping: 20 } }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
