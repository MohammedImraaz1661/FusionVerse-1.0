import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const GlassDock = React.forwardRef(
  (
    {
      items,
      className = '',
      dockClassName = '',
      ...props
    },
    ref
  ) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [direction, setDirection] = useState(0);

    const handleMouseEnter = (index) => {
      if (hoveredIndex !== null && index !== hoveredIndex) {
        setDirection(index > hoveredIndex ? 1 : -1);
      }
      setHoveredIndex(index);
    };

    const getTooltipPosition = (index) => index * 56 + 16;

    return (
      <div
        ref={ref}
        style={{ width: 'max-content' }}
        className={className}
        {...props}
      >
        <div
          className={dockClassName}
          style={{
            position: 'relative',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            padding: '8px 24px',
            borderRadius: '18px',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
          }}
          onMouseLeave={() => {
            setHoveredIndex(null);
            setDirection(0);
          }}
        >
          <AnimatePresence>
            {hoveredIndex !== null && (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.92, y: 12 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: -56,
                  x: getTooltipPosition(hoveredIndex),
                }}
                exit={{ opacity: 0, scale: 0.92, y: 12 }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  pointerEvents: 'none',
                  zIndex: 30,
                }}
              >
                <div
                  style={{
                    padding: '6px 16px',
                    borderRadius: '10px',
                    background: '#fff',
                    color: '#000',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.2)',
                    minWidth: '80px',
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      width: '100%',
                    }}
                  >
                    <AnimatePresence mode="popLayout" custom={direction}>
                      <motion.span
                        key={items[hoveredIndex].title}
                        custom={direction}
                        initial={{
                          x: direction > 0 ? 35 : -35,
                          opacity: 0,
                          filter: 'blur(6px)',
                        }}
                        animate={{
                          x: 0,
                          opacity: 1,
                          filter: 'blur(0px)',
                        }}
                        exit={{
                          x: direction > 0 ? -35 : 35,
                          opacity: 0,
                          filter: 'blur(6px)',
                        }}
                        transition={{
                          duration: 0.3,
                          ease: 'easeOut',
                        }}
                        style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          letterSpacing: '0.02em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {items[hoveredIndex].title}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {items.map((el, index) => {
            const isHovered = hoveredIndex === index;
            const handleClick = () => {
              if (el.onClick) {
                el.onClick();
              } else if (el.href) {
                window.location.href = el.href;
              }
            };

            return (
              <div
                key={el.title}
                onMouseEnter={() => handleMouseEnter(index)}
                onClick={handleClick}
                style={{
                  position: 'relative',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleClick();
                  }
                }}
              >
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    scale: isHovered ? 1.15 : 1,
                    y: isHovered ? -3 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                >
                  <i
                    className={el.icon}
                    style={{
                      fontSize: '22px',
                      transition: 'color 0.2s ease',
                      color: '#ffffff',
                    }}
                  />
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

GlassDock.displayName = 'GlassDock';

export default GlassDock;
