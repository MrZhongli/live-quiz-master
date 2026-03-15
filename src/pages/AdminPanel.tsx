import { useGameStore } from '@/store/gameStore';
import { LEVEL_AMOUNTS, MILESTONE_LEVELS } from '@/types/game';
import { Phone, Users, Scissors, Play, Eye, SkipForward, Square, RotateCcw, Zap } from 'lucide-react';

const AdminPanel = () => {
  const {
    questionSets, session, lifelines, overlayState,
    createSession, startGame, nextQuestion, revealAnswer,
    finishGame, useLifeline, resetGame,
  } = useGameStore();

  const currentSet = questionSets.find(s => s.id === session?.setId);
  const isPlaying = session?.status === 'PLAYING';
  const canReveal = isPlaying && overlayState.currentQuestion && !overlayState.revealAnswer;
  const canNext = isPlaying && overlayState.revealAnswer;
  const isFinished = session?.status === 'FINISHED' || session?.status === 'WON' || session?.status === 'LOST';

  const lifelineIcons = {
    FIFTY_FIFTY: Scissors,
    ASK_AUDIENCE: Users,
    PHONE_FRIEND: Phone,
  };

  const lifelineLabels = {
    FIFTY_FIFTY: '50:50',
    ASK_AUDIENCE: 'Ask Audience',
    PHONE_FRIEND: 'Phone a Friend',
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-black text-foreground tracking-tight">
              <Zap className="inline-block mr-2 text-accent" size={28} />
              Game Control Panel
            </h1>
            <p className="text-muted-foreground mt-1 font-body">Live production dashboard</p>
          </div>
          {session && (
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-lg font-display font-bold text-sm uppercase tracking-wider ${
                isPlaying ? 'bg-success/20 text-success' :
                isFinished ? 'bg-muted text-muted-foreground' :
                'bg-accent/20 text-accent'
              }`}>
                {session.status}
              </span>
            </div>
          )}
        </div>

        {/* No Session */}
        {!session && (
          <div className="glass-panel p-12 text-center">
            <h2 className="text-2xl font-display font-bold text-foreground mb-6">Start a New Game</h2>
            <div className="grid gap-4 max-w-md mx-auto">
              {questionSets.map(qs => (
                <button
                  key={qs.id}
                  onClick={() => createSession(qs.id)}
                  className="admin-btn-primary w-full"
                >
                  <Play className="inline-block mr-2" size={20} />
                  {qs.name} ({qs.questions.length} questions)
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active Session */}
        {session && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Live Controls */}
            <div className="lg:col-span-2 space-y-6">
              {/* Game Controls */}
              <div className="glass-panel p-6">
                <h2 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  Live Controls
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {session.status === 'WAITING' && (
                    <button onClick={startGame} className="admin-btn-success col-span-2">
                      <Play className="inline-block mr-2" size={20} />
                      Start Game
                    </button>
                  )}
                  {isPlaying && (
                    <>
                      <button
                        onClick={nextQuestion}
                        disabled={!canNext}
                        className={`admin-btn-primary ${!canNext ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        <SkipForward className="inline-block mr-2" size={20} />
                        Next Question
                      </button>
                      <button
                        onClick={revealAnswer}
                        disabled={!canReveal}
                        className={`admin-btn-gold ${!canReveal ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        <Eye className="inline-block mr-2" size={20} />
                        Reveal Answer
                      </button>
                    </>
                  )}
                  {isPlaying && (
                    <button onClick={finishGame} className="admin-btn-danger col-span-2">
                      <Square className="inline-block mr-2" size={20} />
                      End Game
                    </button>
                  )}
                  {isFinished && (
                    <button onClick={resetGame} className="admin-btn-primary col-span-2">
                      <RotateCcw className="inline-block mr-2" size={20} />
                      New Game
                    </button>
                  )}
                </div>
              </div>

              {/* Lifelines */}
              {isPlaying && (
                <div className="glass-panel p-6">
                  <h2 className="text-lg font-display font-bold text-foreground mb-4">Lifelines</h2>
                  <div className="grid grid-cols-3 gap-4">
                    {lifelines.map(ll => {
                      const Icon = lifelineIcons[ll.type];
                      return (
                        <button
                          key={ll.id}
                          onClick={() => useLifeline(ll.type)}
                          disabled={ll.used || !overlayState.currentQuestion || overlayState.revealAnswer}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 font-display font-bold ${
                            ll.used
                              ? 'border-muted bg-muted/20 text-muted-foreground opacity-50'
                              : 'border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 hover:border-accent cursor-pointer'
                          }`}
                        >
                          <Icon size={28} />
                          <span className="text-sm">{lifelineLabels[ll.type]}</span>
                          {ll.used && <span className="text-xs text-destructive">USED</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Current Question Preview */}
              {overlayState.currentQuestion && (
                <div className="glass-panel-gold p-6">
                  <h2 className="text-lg font-display font-bold text-foreground mb-3">Current Question</h2>
                  <div className="bg-background/50 rounded-lg p-4 mb-4">
                    <p className="text-xs text-accent font-display font-bold mb-1">
                      Level {overlayState.currentQuestion.level} • {overlayState.currentQuestion.category}
                    </p>
                    <p className="text-foreground font-display font-semibold text-lg">
                      {overlayState.currentQuestion.text}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {overlayState.currentQuestion.answers.map((ans, i) => {
                      const isHidden = overlayState.hiddenAnswerIds.includes(ans.id);
                      const isCorrect = overlayState.correctAnswerId === ans.id;
                      return (
                        <div
                          key={ans.id}
                          className={`p-3 rounded-lg border transition-all ${
                            isHidden ? 'opacity-20 border-border' :
                            isCorrect ? 'border-success bg-success/20 glow-green' :
                            'border-border bg-background/30'
                          }`}
                        >
                          <span className="text-accent font-display font-bold mr-2">
                            {String.fromCharCode(65 + i)}:
                          </span>
                          <span className="text-foreground">{ans.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Level Progress */}
            <div className="space-y-6">
              <div className="glass-panel p-6">
                <h2 className="text-lg font-display font-bold text-foreground mb-4">Prize Ladder</h2>
                <div className="flex flex-col-reverse gap-1.5">
                  {Array.from({ length: 15 }, (_, i) => i + 1).map(level => {
                    const isCurrent = session.currentLevel === level;
                    const isCompleted = session.currentLevel > level;
                    const isMilestone = MILESTONE_LEVELS.includes(level);
                    return (
                      <div
                        key={level}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg font-display text-sm transition-all duration-300 ${
                          isCurrent ? 'bg-primary text-primary-foreground glow-blue font-bold scale-105' :
                          isCompleted ? 'bg-accent/15 text-accent font-semibold' :
                          isMilestone ? 'bg-accent/5 text-accent/70 font-semibold' :
                          'bg-secondary/30 text-muted-foreground'
                        }`}
                      >
                        <span>{level}</span>
                        <span>{LEVEL_AMOUNTS[level]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Session Info */}
              <div className="glass-panel p-6">
                <h2 className="text-lg font-display font-bold text-foreground mb-3">Session Info</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Question Set</span>
                    <span className="text-foreground font-semibold">{currentSet?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Level</span>
                    <span className="text-accent font-display font-bold">{session.currentLevel}/15</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prize</span>
                    <span className="text-accent font-display font-bold">
                      {LEVEL_AMOUNTS[session.currentLevel] || '$0'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
