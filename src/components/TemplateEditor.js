import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  PanResponder, Animated, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const VAR_INFO = {
  name: { color: '#007AFF', label: 'Nombre' },
  balance: { color: '#34C759', label: 'Saldo' },
};

// ─── Parse template string into fine-grained items (words + vars) ───
function parseToItems(template) {
  if (!template) return [];
  const items = [];
  const regex = /\{(name|balance)\}/g;
  let last = 0;
  let m;
  while ((m = regex.exec(template)) !== null) {
    if (m.index > last) {
      const words = template.substring(last, m.index).match(/\S+\s*/g);
      if (words) words.forEach(w => items.push({ type: 'text', value: w }));
    }
    items.push({ type: 'var', key: m[1] });
    last = regex.lastIndex;
  }
  if (last < template.length) {
    const words = template.substring(last).match(/\S+\s*/g);
    if (words) words.forEach(w => items.push({ type: 'text', value: w }));
  }
  return items;
}

function itemsToString(items) {
  return items.map(i => (i.type === 'var' ? `{${i.key}}` : i.value)).join('');
}

// ═══════════════ Draggable Bubble ═══════════════
const DraggableBubble = ({ varKey, isDragging, onDragStart, onDragMove, onDragEnd }) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const cb = useRef({ onDragStart, onDragMove, onDragEnd });
  useEffect(() => { cb.current = { onDragStart, onDragMove, onDragEnd }; });

  const pr = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Animated.spring(scale, { toValue: 1.18, useNativeDriver: true, friction: 6 }).start();
        cb.current.onDragStart();
      },
      onPanResponderMove: (evt, gs) => {
        pan.setValue({ x: gs.dx, y: gs.dy });
        cb.current.onDragMove(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
      },
      onPanResponderRelease: () => {
        const success = cb.current.onDragEnd();
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
        if (success) {
          pan.setValue({ x: 0, y: 0 });
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true, friction: 6 }).start();
        }
      },
      onPanResponderTerminate: () => {
        cb.current.onDragEnd();
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
      },
    })
  ).current;

  const { color, label } = VAR_INFO[varKey];

  return (
    <Animated.View
      style={{
        transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale }],
        zIndex: isDragging ? 100 : 1,
      }}
      {...pr.panHandlers}
    >
      <View style={[styles.bubble, { backgroundColor: color }]}>
        <Text style={styles.bubbleText}>{label}</Text>
      </View>
    </Animated.View>
  );
};

// ═══════════════ Main Editor ═══════════════
const TemplateEditor = ({ value, onChange }) => {
  const [items, setItems] = useState([]);
  const [dragIdx, setDragIdx] = useState(null);
  const [dropPos, setDropPos] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const editInputRef = useRef(null);
  const cursorPos = useRef(0);

  const lastEmitted = useRef(null);
  const itemLayouts = useRef([]);
  const rowRef = useRef(null);
  const rowOffset = useRef({ x: 0, y: 0 });
  const itemsRef = useRef(items);
  const dragIdxRef = useRef(null);
  const dropPosRef = useRef(null);

  useEffect(() => { itemsRef.current = items; }, [items]);

  // Sync items from value prop — only when value changes externally
  useEffect(() => {
    if (lastEmitted.current === null || value !== lastEmitted.current) {
      lastEmitted.current = value || '';
      setItems(parseToItems(value || ''));
    }
  }, [value]);

  // Emit changes to parent when items change (deferred via useEffect to avoid setState-in-render)
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    if (lastEmitted.current === null) return; // skip before init
    const str = itemsToString(items);
    if (str !== lastEmitted.current) {
      lastEmitted.current = str;
      onChangeRef.current(str);
    }
  }, [items]);

  const hasName = items.some(i => i.type === 'var' && i.key === 'name');
  const hasBalance = items.some(i => i.type === 'var' && i.key === 'balance');

  const addVariable = (key) => {
    setItems(prev => [...prev, { type: 'var', key }]);
  };

  const removeVariable = (key) => {
    setItems(prev => prev.filter(i => !(i.type === 'var' && i.key === key)));
  };

  // ─── Edit mode ───
  const startEditing = () => {
    const raw = itemsToString(items);
    setEditText(raw);
    setEditing(true);
    setTimeout(() => editInputRef.current?.focus(), 100);
  };

  const finishEditing = () => {
    setEditing(false);
    setItems(parseToItems(editText));
  };

  const insertVariable = (key) => {
    const tag = `{${key}}`;
    const pos = cursorPos.current;
    const newText = editText.slice(0, pos) + tag + editText.slice(pos);
    setEditText(newText);
    const newPos = pos + tag.length;
    cursorPos.current = newPos;
    setTimeout(() => {
      editInputRef.current?.setNativeProps({ selection: { start: newPos, end: newPos } });
    }, 50);
  };

  const editHasName = editText.includes('{name}');
  const editHasBalance = editText.includes('{balance}');

  // ─── Drag logic ───
  const handleDragStart = (idx) => {
    rowRef.current?.measureInWindow((x, y) => {
      rowOffset.current = { x, y };
    });
    dragIdxRef.current = idx;
    setDragIdx(idx);
  };

  const handleDragMove = (pageX, pageY) => {
    const idx = dragIdxRef.current;
    if (idx === null) return;

    const off = rowOffset.current;
    const rx = pageX - off.x;
    const ry = pageY - off.y;
    const layouts = itemLayouts.current;
    const count = itemsRef.current.length;

    let best = null;
    let bestDist = Infinity;

    for (let g = 0; g <= count; g++) {
      if (g === idx || g === idx + 1) continue;

      let gx, gy;
      if (g === 0) {
        if (!layouts[0]) continue;
        gx = layouts[0].x;
        gy = layouts[0].y + layouts[0].height / 2;
      } else if (g >= count) {
        const l = layouts[count - 1];
        if (!l) continue;
        gx = l.x + l.width;
        gy = l.y + l.height / 2;
      } else {
        const prev = layouts[g - 1];
        const next = layouts[g];
        if (!prev || !next) continue;
        const sameRow = Math.abs(prev.y - next.y) < 10;
        gx = sameRow ? (prev.x + prev.width + next.x) / 2 : next.x;
        gy = (sameRow ? prev : next).y + (sameRow ? prev : next).height / 2;
      }

      const dist = Math.hypot(rx - gx, ry - gy);
      if (dist < bestDist) {
        bestDist = dist;
        best = g;
      }
    }

    dropPosRef.current = best;
    setDropPos(best);
  };

  const handleDragEnd = () => {
    const idx = dragIdxRef.current;
    const pos = dropPosRef.current;
    let success = false;

    if (idx !== null && pos !== null) {
      success = true;
      setItems(prev => {
        const item = prev[idx];
        const without = prev.filter((_, i) => i !== idx);
        const insertAt = pos > idx ? pos - 1 : pos;
        return [...without.slice(0, insertAt), item, ...without.slice(insertAt)];
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    dragIdxRef.current = null;
    dropPosRef.current = null;
    setDragIdx(null);
    setDropPos(null);

    return success;
  };

  // ─── Drop indicator position ───
  const getDropIndicatorStyle = () => {
    if (dropPos === null || dragIdx === null) return null;
    const layouts = itemLayouts.current;
    const count = items.length;

    let left, top, height;
    if (dropPos === 0 && layouts[0]) {
      left = layouts[0].x - 2;
      top = layouts[0].y;
      height = layouts[0].height;
    } else if (dropPos >= count && layouts[count - 1]) {
      const l = layouts[count - 1];
      left = l.x + l.width + 1;
      top = l.y;
      height = l.height;
    } else {
      const prev = layouts[dropPos - 1];
      const next = layouts[dropPos];
      if (!prev || !next) return null;
      const sameRow = Math.abs(prev.y - next.y) < 10;
      left = sameRow ? (prev.x + prev.width + next.x) / 2 - 1.5 : next.x - 2;
      top = (sameRow ? prev : next).y;
      height = (sameRow ? prev : next).height;
    }

    return { left, top, height };
  };

  const dropStyle = getDropIndicatorStyle();

  return (
    <View style={styles.container}>
      {editing ? (
        /* ═══ Edit mode ═══ */
        <View>
          <View style={styles.editHeader}>
            <Text style={styles.editHeaderText}>Editando mensaje</Text>
            <TouchableOpacity style={styles.doneButton} onPress={finishEditing}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              <Text style={styles.doneButtonText}>Listo</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.contentArea}>
            <TextInput
              ref={editInputRef}
              style={styles.editInput}
              value={editText}
              onChangeText={setEditText}
              onSelectionChange={(e) => { cursorPos.current = e.nativeEvent.selection.start; }}
              multiline
              placeholder="Escribe tu mensaje aquí..."
              placeholderTextColor="#8E8E93"
              autoCorrect={false}
            />
            <Text style={styles.editHint}>
              Usa los botones de abajo para insertar variables en la posición del cursor
            </Text>
          </View>
          <View style={styles.varBar}>
            <Text style={styles.varLabel}>Insertar:</Text>
            <TouchableOpacity
              style={[styles.varChipOff, editHasName && { borderColor: '#8E8E93' }]}
              onPress={() => insertVariable('name')}
            >
              <Ionicons name="add" size={13} color={editHasName ? '#8E8E93' : '#007AFF'} />
              <Text style={[styles.varChipOffText, editHasName && { color: '#8E8E93' }]}>Nombre</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.varChipOff, editHasBalance && { borderColor: '#8E8E93' }]}
              onPress={() => insertVariable('balance')}
            >
              <Ionicons name="add" size={13} color={editHasBalance ? '#8E8E93' : '#34C759'} />
              <Text style={[styles.varChipOffText, editHasBalance && { color: '#8E8E93' }]}>Saldo</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* ═══ Visual mode ═══ */
        <View>
          <View style={styles.contentArea}>
            <TouchableOpacity style={styles.editIcon} onPress={startEditing}>
              <Ionicons name="pencil" size={14} color="#8E8E93" />
            </TouchableOpacity>
            <View
              style={styles.itemsRow}
              ref={rowRef}
              onLayout={() => {
                rowRef.current?.measureInWindow((x, y) => {
                  rowOffset.current = { x, y };
                });
              }}
            >
              {items.length === 0 ? (
                <Text style={styles.placeholder}>Agrega variables con los botones de abajo</Text>
              ) : (
                items.map((item, i) => {
                  if (item.type === 'var') {
                    return (
                      <View
                        key={item.key}
                        onLayout={(e) => {
                          itemLayouts.current[i] = e.nativeEvent.layout;
                        }}
                      >
                        <DraggableBubble
                          varKey={item.key}
                          isDragging={dragIdx === i}
                          onDragStart={() => handleDragStart(i)}
                          onDragMove={(px, py) => handleDragMove(px, py)}
                          onDragEnd={() => handleDragEnd()}
                        />
                      </View>
                    );
                  }
                  return (
                    <Text
                      key={`t-${i}`}
                      style={[styles.wordText, dragIdx !== null && styles.wordTextDim]}
                      onLayout={(e) => {
                        itemLayouts.current[i] = e.nativeEvent.layout;
                      }}
                    >
                      {item.value}
                    </Text>
                  );
                })
              )}

              {/* Drop indicator */}
              {dropStyle && (
                <View
                  style={[
                    styles.dropIndicator,
                    { left: dropStyle.left, top: dropStyle.top, height: dropStyle.height },
                  ]}
                />
              )}
            </View>

            {dragIdx !== null && (
              <Text style={styles.hintText}>Arrastra la burbuja a su nueva posición</Text>
            )}
          </View>

      {/* Variable bar */}
      <View style={styles.varBar}>
        <Text style={styles.varLabel}>Variables:</Text>
        {hasName ? (
          <TouchableOpacity style={styles.varChipOn} onPress={() => removeVariable('name')}>
            <View style={[styles.varDot, { backgroundColor: '#007AFF' }]} />
            <Text style={styles.varChipOnText}>Nombre</Text>
            <Ionicons name="close" size={12} color="#FF3B30" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.varChipOff} onPress={() => addVariable('name')}>
            <Ionicons name="add" size={13} color="#007AFF" />
            <Text style={styles.varChipOffText}>Nombre</Text>
          </TouchableOpacity>
        )}
        {hasBalance ? (
          <TouchableOpacity style={styles.varChipOn} onPress={() => removeVariable('balance')}>
            <View style={[styles.varDot, { backgroundColor: '#34C759' }]} />
            <Text style={styles.varChipOnText}>Saldo</Text>
            <Ionicons name="close" size={12} color="#FF3B30" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.varChipOff} onPress={() => addVariable('balance')}>
            <Ionicons name="add" size={13} color="#34C759" />
            <Text style={styles.varChipOffText}>Saldo</Text>
          </TouchableOpacity>
        )}
      </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
  },
  // ─── Visual mode ───
  contentArea: {
    padding: 12,
    minHeight: 60,
  },
  itemsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  wordText: {
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 32,
  },
  wordTextDim: {
    opacity: 0.45,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginVertical: 2,
    marginHorizontal: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  bubbleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dropIndicator: {
    position: 'absolute',
    width: 3,
    backgroundColor: '#FF9500',
    borderRadius: 2,
  },
  hintText: {
    fontSize: 10,
    color: '#AEAEB2',
    marginTop: 8,
    textAlign: 'center',
  },
  placeholder: {
    fontSize: 15,
    color: '#8E8E93',
  },
  editIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 10,
    backgroundColor: '#E5E5EA',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
  },
  editHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  doneButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  editInput: {
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 22,
    minHeight: 80,
    textAlignVertical: 'top',
    padding: 0,
  },
  editHint: {
    fontSize: 10,
    color: '#AEAEB2',
    marginTop: 6,
    textAlign: 'center',
  },
  // ─── Variable bar ───
  varBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  varLabel: {
    fontSize: 11,
    color: '#8E8E93',
  },
  varDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  varChipOn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  varChipOnText: {
    fontSize: 11,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  varChipOff: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  varChipOffText: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default TemplateEditor;
