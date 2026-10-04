import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet } from '../../../core/designsystem/components/Sheet';
import { Button } from '../../../core/designsystem/components/Button';
import { Dialog } from '../../../core/designsystem/components/Dialog';
import { Icon } from '../../../core/designsystem/icons/Icon';
import { useRepos } from '../../../app/providers/RepositoryProvider';
import { useTagColors, useTags } from '../application/hooks';

export function TagEditDialog({
  open,
  onClose,
  editingId,
  initialName,
  initialColorTcid,
}: {
  open: boolean;
  onClose: () => void;
  editingId?: number | null;
  initialName?: string;
  initialColorTcid?: number;
}) {
  const { t } = useTranslation();
  const repos = useRepos();
  const colors = useTagColors();
  const [name, setName] = useState(initialName ?? '');
  const [tcid, setTcid] = useState(initialColorTcid ?? colors[0]?.tcid ?? 1);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (editingId) {
      await repos.tags.update(editingId, { tag: trimmed.slice(0, 20), tagColorTcid: tcid });
    } else {
      await repos.tags.create({ tag: trimmed, tagColorTcid: tcid });
    }
    setName('');
    onClose();
  };

  const remove = async () => {
    if (editingId) await repos.tags.softDelete(editingId);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editingId ? t('tags.edit') : t('tags.add')}
      actions={
        <>
          {editingId && (
            <Button variant="red" onClick={() => void remove()}>
              {t('common.delete')}
            </Button>
          )}
          <Button variant="gray" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={() => void save()} disabled={!name.trim()}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <label className="mb-1 block text-caption1 text-[var(--text-tertiary)]" htmlFor="tag-name">
        {t('tags.name')}
      </label>
      <input
        id="tag-name"
        value={name}
        maxLength={20}
        onChange={(e) => setName(e.target.value)}
        className="mb-3 w-full rounded-[var(--radius-s)] border px-3 py-2 text-body2"
        style={{ borderColor: 'var(--gray-300)' }}
      />
      <p className="mb-2 text-caption1 text-[var(--text-tertiary)]">{t('tags.color')}</p>
      <div className="grid grid-cols-5 gap-2">
        {colors.map((color) => (
          <button
            key={color.tcid}
            aria-label={color.hexCode}
            onClick={() => setTcid(color.tcid)}
            className="flex h-9 items-center justify-center rounded-full"
            style={{ background: color.hexCode }}
          >
            {tcid === color.tcid && <Icon name="check" size={16} className="text-white" />}
          </button>
        ))}
      </div>
    </Dialog>
  );
}

export function TagPicker({
  open,
  onClose,
  selectedTagId,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  selectedTagId: number | null;
  onSelect: (tagId: number | null) => void;
}) {
  const { t } = useTranslation();
  const tags = useTags();
  const colors = useTagColors();
  const colorMap = new Map(colors.map((c) => [c.tcid, c.hexCode]));
  const [editing, setEditing] = useState<{ id: number; name: string; tcid: number } | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <Sheet open={open} onClose={onClose} title={t('tags.title')}>
      <div className="space-y-1">
        <button
          onClick={() => {
            onSelect(null);
            onClose();
          }}
          className="flex w-full items-center gap-3 rounded-[var(--radius-m)] p-3 text-left"
          style={{ background: selectedTagId === null ? 'var(--bg-secondary)' : 'transparent' }}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--gray-400)]" />
          <span className="flex-1 text-subtitle1">{t('tags.noTag')}</span>
          {selectedTagId === null && <Icon name="check" size={18} className="text-[var(--brand)]" />}
        </button>
        {tags
          .filter((tag) => tag.usedAt > 0)
          .map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-3 rounded-[var(--radius-m)] p-3"
              style={{ background: selectedTagId === tag.id ? 'var(--bg-secondary)' : 'transparent' }}
            >
              <button
                className="flex flex-1 items-center gap-3 text-left"
                onClick={() => {
                  onSelect(tag.id ?? null);
                  onClose();
                }}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: colorMap.get(tag.tagColorTcid) ?? 'var(--gray-400)' }}
                />
                <span className="flex-1 text-subtitle1">{tag.tag}</span>
                {selectedTagId === tag.id && <Icon name="check" size={18} className="text-[var(--brand)]" />}
              </button>
              <button
                aria-label={t('common.edit')}
                onClick={() =>
                  setEditing({ id: tag.id as number, name: tag.tag, tcid: tag.tagColorTcid })
                }
                className="text-[var(--text-tertiary)]"
              >
                <Icon name="edit" size={16} />
              </button>
            </div>
          ))}
      </div>
      <Button
        variant="accentTeal"
        full
        className="mt-4"
        leadingIcon={<Icon name="plus" size={16} />}
        onClick={() => setCreating(true)}
      >
        {t('tags.add')}
      </Button>

      <TagEditDialog open={creating} onClose={() => setCreating(false)} />
      <TagEditDialog
        key={editing?.id}
        open={editing !== null}
        onClose={() => setEditing(null)}
        editingId={editing?.id ?? null}
        initialName={editing?.name}
        initialColorTcid={editing?.tcid}
      />
    </Sheet>
  );
}
