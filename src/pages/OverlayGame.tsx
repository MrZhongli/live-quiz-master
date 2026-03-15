import { useGameStore } from '@/store/gameStore';
import { LEVEL_AMOUNTS, MILESTONE_LEVELS, ANSWER_LABELS } from '@/types/game';
import { motion, AnimatePresence } from 'framer-motion';

const OverlayGame = () => {
  const { overlayState, session } = useGameStore();
  const { currentQuestion, revealAnswer, hiddenAnswerIds, correctAnswerId, gameFinished } = overlayState;

  return (
    <div className="w-[1920px] h-[1080px] relative overflow-hidden" style={{ background: 'transparent' }}>
      {/* Level Ladder - Right Side */}
      <AnimatePresence>
        {session && session.status === 'PLAYING' && currentQuestion && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-52"
          >
            <div className="bg-card/80 backdrop-blur-xl border border-primary/20 rounded-2xl p-3 flex flex-col-reverse gap-1">
              {Array.from({ length: 15 }, (_, i) => i + 1).map(level => {
                const isCurrent = session.currentLevel === level;
                const isCompleted = session.currentLevel > level;
                const isMilestone = MILESTONE_LEVELS.includes(level);
                return (
                  <motion.div
                    key={level}
                    animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.6, repeat: isCurrent ? Infinity : 0, repeatDelay: 2 }}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg font-display text-xs transition-all ${
                      isCurrent ? 'bg-primary text-primary-foreground font-bold glow-blue' :
                      isCompleted ? 'bg-accent/20 text-accent font-semibold' :
                      isMilestone ? 'text-accent/60 font-semibold' :
                      'text-muted-foreground/50'
                    }`}
                  >
                    <span>{level}</span>
                    <span>{LEVEL_AMOUNTS[level]}</span>
                  </motion.div>
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
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="absolute bottom-8 left-8 right-72"
          >
            {/* Category Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-3 flex items-center gap-3"
            >
              <span className="bg-accent/20 text-accent px-4 py-1.5 rounded-full font-display font-bold text-sm border border-accent/30">
                {currentQuestion.category}
              </span>
              <span className="text-accent font-display font-bold text-sm">
                Level {currentQuestion.level} — {LEVEL_AMOUNTS[currentQuestion.level]}
              </span>
            </motion.div>

            {/* Question Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="bg-card/85 backdrop-blur-2xl border border-primary/30 rounded-2xl px-10 py-6 mb-5 glow-blue"
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
                          delay: 0.25 + index * 0.1,
                          duration: 0.3,
                          ...(isCorrectAnswer && isRevealed ? {
                            scale: { duration: 0.6, repeat: 1, ease: 'easeInOut' }
                          } : {}),
                        }}
                        className={`
                          flex items-center gap-4 px-8 py-5 rounded-xl border-2 backdrop-blur-xl transition-colors duration-500
                          ${isCorrectAnswer && isRevealed
                            ? 'bg-success/30 border-success glow-green'
                            : isRevealed
                              ? 'bg-card/50 border-border/30 opacity-60'
                              : 'bg-card/70 border-primary/20 hover:border-primary/40'
                          }
                        `}
                      >
                        <span className={`font-display font-black text-xl w-9 h-9 flex items-center justify-center rounded-lg ${
                          isCorrectAnswer && isRevealed
                            ? 'bg-success text-success-foreground'
                            : 'bg-accent/20 text-accent'
                        }`}>
                          {ANSWER_LABELS[index]}
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
