import { useGameStore } from '@/store/gameStore';
import { LEVEL_AMOUNTS, MILESTONE_LEVELS, ANSWER_LABELS } from '@/types/game';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Users, Phone } from 'lucide-react';

const OverlayGame = () => {
  const { overlayState, session, lifelines } = useGameStore();
  const { currentQuestion, revealAnswer, hiddenAnswerIds, correctAnswerId, gameFinished } = overlayState;

  const lifelineIcons = {
    FIFTY_FIFTY: Scissors,
    ASK_AUDIENCE: Users,
    PHONE_FRIEND: Phone,
  };

  return (
    <div className="w-[1920px] h-[1080px] relative overflow-hidden" style={{ background: 'transparent' }}>

      {/* Lifelines - Top Right */}
      <AnimatePresence>
        {session && session.status === 'PLAYING' && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute top-6 right-8 flex items-center gap-3"
          >
            {lifelines.map(ll => {
              const Icon = lifelineIcons[ll.type];
              return (
                <motion.div
                  key={ll.id}
                  animate={ll.used ? { opacity: 0.3, scale: 0.9 } : { opacity: 1, scale: 1 }}
                  className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${
                    ll.used
                      ? 'bg-muted/60 border-muted-foreground/30'
                      : 'bg-card/80 border-accent/60 backdrop-blur-xl'
                  }`}
                >
                  <Icon size={24} className={ll.used ? 'text-muted-foreground' : 'text-accent'} />
                  {ll.used && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-0.5 bg-destructive rotate-45 rounded-full" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Horizontal Level Ladder - Bottom area, above question */}
      <AnimatePresence>
        {session && session.status === 'PLAYING' && currentQuestion && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute bottom-[340px] left-1/2 -translate-x-1/2"
          >
            <div className="flex items-center gap-0">
              {Array.from({ length: 15 }, (_, i) => i + 1).map((level, idx) => {
                const isCurrent = session.currentLevel === level;
                const isCompleted = session.currentLevel > level;
                const isMilestone = MILESTONE_LEVELS.includes(level);
                return (
                  <div key={level} className="flex items-center">
                    <motion.div
                      animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
                      transition={{ duration: 1.2, repeat: isCurrent ? Infinity : 0, repeatDelay: 1 }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm border-2 transition-all ${
                        isCurrent
                          ? 'bg-accent text-accent-foreground border-accent glow-gold scale-110 z-10'
                          : isCompleted
                            ? 'bg-success/80 text-success-foreground border-success/60'
                            : isMilestone
                              ? 'bg-card/60 text-accent/70 border-accent/40'
                              : 'bg-card/40 text-muted-foreground/60 border-border/40'
                      }`}
                    >
                      {level}
                    </motion.div>
                    {idx < 14 && (
                      <div className={`w-6 h-0.5 ${
                        isCompleted ? 'bg-success/60' : 'bg-border/40'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question & Answers - Lower Third */}
      <AnimatePresence mode="wait">
        {currentQuestion && !gameFinished && (
          <motion.div
            key={currentQuestion.id}
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="absolute bottom-6 left-12 right-12"
          >
            {/* Question Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="bg-card/85 backdrop-blur-2xl border border-primary/30 rounded-2xl px-10 py-5 mb-4 text-center"
            >
              <p className="text-foreground font-display font-bold text-2xl leading-relaxed">
                {currentQuestion.text}
              </p>
            </motion.div>

            {/* Answer Grid 2x2 */}
            <div className="grid grid-cols-2 gap-3">
              {currentQuestion.answers.map((answer, index) => {
                const isHidden = hiddenAnswerIds.includes(answer.id);
                const isCorrectAnswer = correctAnswerId === answer.id;
                const isRevealed = revealAnswer;

                return (
                  <AnimatePresence key={answer.id}>
                    {!isHidden && (
                      <motion.div
                        initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                        animate={{
                          opacity: 1,
                          x: 0,
                          scale: isCorrectAnswer && isRevealed ? [1, 1.03, 1] : 1,
                        }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{
                          delay: 0.2 + index * 0.08,
                          duration: 0.3,
                          ...(isCorrectAnswer && isRevealed ? {
                            scale: { duration: 0.6, repeat: 1, ease: 'easeInOut' }
                          } : {}),
                        }}
                        className={`
                          flex items-center gap-4 px-8 py-4 rounded-xl border-2 backdrop-blur-xl transition-colors duration-500
                          ${isCorrectAnswer && isRevealed
                            ? 'bg-success/30 border-success glow-green'
                            : isRevealed
                              ? 'bg-card/50 border-border/30 opacity-60'
                              : 'bg-card/70 border-primary/20'
                          }
                        `}
                      >
                        <span className={`font-display font-black text-lg ${
                          isCorrectAnswer && isRevealed
                            ? 'text-success'
                            : 'text-accent'
                        }`}>
                          · {ANSWER_LABELS[index]}:
                        </span>
                        <span className="text-foreground font-display font-semibold text-lg">
                          {answer.text}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Finished Screen */}
      <AnimatePresence>
        {gameFinished && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="bg-card/90 backdrop-blur-2xl border-2 border-accent/40 rounded-3xl px-20 py-16 text-center glow-gold">
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-accent font-display font-black text-5xl mb-4"
              >
                {session?.status === 'WON' ? '🏆 WINNER!' : 'GAME OVER'}
              </motion.p>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-foreground font-display font-bold text-3xl"
              >
                {session?.status === 'WON'
                  ? LEVEL_AMOUNTS[session.currentLevel]
                  : `Reached Level ${session?.currentLevel || 0}`
                }
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Waiting State */}
      <AnimatePresence>
        {session?.status === 'WAITING' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2"
          >
            <div className="bg-card/80 backdrop-blur-xl border border-accent/30 rounded-2xl px-12 py-6 glow-gold">
              <p className="text-accent font-display font-bold text-2xl animate-pulse">
                Game Starting Soon...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OverlayGame;
