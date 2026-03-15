import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Plus, Trash2, Edit2, ChevronDown, ChevronRight, Save, X } from 'lucide-react';
import type { Question, Answer } from '@/types/game';

const emptyAnswer = (qId: string, index: number): Answer => ({
  id: crypto.randomUUID(),
  text: '',
  isCorrect: index === 0,
  questionId: qId,
});

const emptyQuestion = (setId: string, level: number): Question => {
  const qId = crypto.randomUUID();
  return {
    id: qId,
    text: '',
    level,
    category: '',
    setId,
    answers: [0, 1, 2, 3].map(i => emptyAnswer(qId, i)),
  };
};

const QuestionSetManager = () => {
  const { questionSets, addQuestionSet, deleteQuestionSet, addQuestion, updateQuestion, deleteQuestion } = useGameStore();
  const [newSetName, setNewSetName] = useState('');
  const [expandedSet, setExpandedSet] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [addingToSet, setAddingToSet] = useState<string | null>(null);

  const handleCreateSet = () => {
    if (!newSetName.trim()) return;
    addQuestionSet(newSetName.trim());
    setNewSetName('');
  };

  const handleSaveQuestion = (q: Question) => {
    if (!q.text.trim() || q.answers.some(a => !a.text.trim())) return;
    if (addingToSet) {
      addQuestion(q.setId, q);
      setAddingToSet(null);
    } else {
      updateQuestion(q);
    }
    setEditingQuestion(null);
  };

  return (
    <div className="space-y-6">
      {/* Create New Set */}
      <div className="glass-panel p-6">
        <h2 className="text-lg font-display font-bold text-foreground mb-4">Create Question Set</h2>
        <div className="flex gap-3">
          <input
            value={newSetName}
            onChange={e => setNewSetName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateSet()}
            placeholder="Set name (e.g. Sports, Science...)"
            className="flex-1 bg-input border border-border rounded-lg px-4 py-3 text-foreground font-body placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button onClick={handleCreateSet} className="admin-btn-primary !py-3 !px-6">
            <Plus size={20} className="inline mr-1" /> Create
          </button>
        </div>
      </div>

      {/* Question Sets List */}
      {questionSets.map(qs => {
        const isExpanded = expandedSet === qs.id;
        return (
          <div key={qs.id} className="glass-panel overflow-hidden">
            {/* Set Header */}
            <div
              className="flex items-center justify-between p-5 cursor-pointer hover:bg-secondary/20 transition-colors"
              onClick={() => setExpandedSet(isExpanded ? null : qs.id)}
            >
              <div className="flex items-center gap-3">
                {isExpanded ? <ChevronDown size={20} className="text-accent" /> : <ChevronRight size={20} className="text-muted-foreground" />}
                <h3 className="font-display font-bold text-foreground text-lg">{qs.name}</h3>
                <span className="text-sm text-muted-foreground font-body">({qs.questions.length} questions)</span>
              </div>
              <button
                onClick={e => { e.stopPropagation(); deleteQuestionSet(qs.id); }}
                className="text-destructive hover:text-destructive/80 p-2 rounded-lg hover:bg-destructive/10 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>

            {/* Questions */}
            {isExpanded && (
              <div className="border-t border-border/50 p-5 space-y-3">
                {qs.questions
                  .sort((a, b) => a.level - b.level)
                  .map(q => (
                    <div key={q.id} className="bg-secondary/30 rounded-lg p-4 flex items-start justify-between gap-4">
                      {editingQuestion?.id === q.id && !addingToSet ? (
                        <QuestionEditor
                          question={editingQuestion}
                          onChange={setEditingQuestion}
                          onSave={() => handleSaveQuestion(editingQuestion)}
                          onCancel={() => setEditingQuestion(null)}
                        />
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-display font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">Lvl {q.level}</span>
                              <span className="text-xs text-muted-foreground font-body">{q.category}</span>
                            </div>
                            <p className="text-foreground font-body text-sm truncate">{q.text}</p>
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {q.answers.map((a, i) => (
                                <span key={a.id} className={`text-xs px-2 py-0.5 rounded font-body ${a.isCorrect ? 'bg-success/20 text-success' : 'bg-muted/30 text-muted-foreground'}`}>
                                  {String.fromCharCode(65 + i)}: {a.text}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => setEditingQuestion({ ...q })} className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => deleteQuestion(qs.id, q.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                {/* Add Question Form */}
                {addingToSet === qs.id && editingQuestion ? (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <QuestionEditor
                      question={editingQuestion}
                      onChange={setEditingQuestion}
                      onSave={() => handleSaveQuestion(editingQuestion)}
                      onCancel={() => { setAddingToSet(null); setEditingQuestion(null); }}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      const nextLevel = qs.questions.length > 0 ? Math.max(...qs.questions.map(q => q.level)) + 1 : 1;
                      const newQ = emptyQuestion(qs.id, nextLevel);
                      setEditingQuestion(newQ);
                      setAddingToSet(qs.id);
                    }}
                    className="w-full py-3 border-2 border-dashed border-border/50 rounded-lg text-muted-foreground hover:border-primary/40 hover:text-primary font-display font-bold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={18} /> Add Question
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

interface QuestionEditorProps {
  question: Question;
  onChange: (q: Question) => void;
  onSave: () => void;
  onCancel: () => void;
}

const QuestionEditor = ({ question, onChange, onSave, onCancel }: QuestionEditorProps) => {
  const updateAnswer = (idx: number, text: string) => {
    const answers = question.answers.map((a, i) => i === idx ? { ...a, text } : a);
    onChange({ ...question, answers });
  };

  const setCorrect = (idx: number) => {
    const answers = question.answers.map((a, i) => ({ ...a, isCorrect: i === idx }));
    onChange({ ...question, answers });
  };

  return (
    <div className="w-full space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          value={question.text}
          onChange={e => onChange({ ...question, text: e.target.value })}
          placeholder="Question text"
          className="col-span-2 bg-input border border-border rounded-lg px-3 py-2 text-foreground text-sm font-body placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="number"
          min={1}
          max={15}
          value={question.level}
          onChange={e => onChange({ ...question, level: parseInt(e.target.value) || 1 })}
          placeholder="Level (1-15)"
          className="bg-input border border-border rounded-lg px-3 py-2 text-foreground text-sm font-body placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          value={question.category}
          onChange={e => onChange({ ...question, category: e.target.value })}
          placeholder="Category"
          className="bg-input border border-border rounded-lg px-3 py-2 text-foreground text-sm font-body placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {question.answers.map((a, i) => (
          <div key={a.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCorrect(i)}
              className={`w-7 h-7 rounded-full flex items-center justify-center font-display font-bold text-xs border-2 shrink-0 transition-colors ${
                a.isCorrect ? 'bg-success border-success text-success-foreground' : 'bg-muted/20 border-border text-muted-foreground hover:border-success/50'
              }`}
            >
              {String.fromCharCode(65 + i)}
            </button>
            <input
              value={a.text}
              onChange={e => updateAnswer(i, e.target.value)}
              placeholder={`Answer ${String.fromCharCode(65 + i)}`}
              className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-foreground text-sm font-body placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-muted-foreground hover:bg-muted/20 font-display font-bold text-sm transition-colors">
          <X size={16} className="inline mr-1" /> Cancel
        </button>
        <button onClick={onSave} className="px-4 py-2 rounded-lg bg-success text-success-foreground font-display font-bold text-sm hover:brightness-110 transition-all">
          <Save size={16} className="inline mr-1" /> Save
        </button>
      </div>
    </div>
  );
};

export default QuestionSetManager;
