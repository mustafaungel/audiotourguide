

## Düzeltme: LiveListenersBadge Gradient Taşması

### Problem

Görselde görüldüğü gibi, badge'in dış gradient katmanı sağ tarafta pill şeklinin dışına taşıyor. `rounded-full` sadece border-radius verir ama içeriği kırpmaz — gradient arka plan taşıyor.

### Çözüm

Dış kapsayıcıya `overflow-hidden` eklemek. Bu, `rounded-full` ile belirlenen sınırların dışındaki gradient'i kırpacak.

### Teknik

```
src/components/LiveListenersBadge.tsx (satır 35)

Önce:  inline-flex max-w-full rounded-full bg-gradient-to-r ...
Sonra: inline-flex max-w-full rounded-full overflow-hidden bg-gradient-to-r ...
```

Tek class eklenmesi — gradient artık pill sınırlarının dışına taşamaz.

