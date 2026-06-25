import { Pressable, Text, View } from 'react-native';

const SIDE_TABS = [
  { id: 'timelog', label: 'Log Time', icon: '⏱' },
  { id: 'planner', label: 'Trip Planner', icon: '🗺' },
  { id: 'calendar', label: 'Calendar', icon: '📅', disabled: true },
];

export default function BottomNav({ activeTab, onTabPress, onAddBlock, showAddBlock }) {
  return (
    <View className="border-t border-app-border bg-app-surface px-2 pb-2 pt-2">
      <View className="flex-row items-center">
        {SIDE_TABS.slice(0, 1).map((tab) => (
          <NavItem
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onPress={() => onTabPress(tab.id)}
          />
        ))}

        {showAddBlock ? (
          <Pressable
            className="mx-1 flex-1 items-center rounded-xl border border-app-accent/40 bg-app-accent/15 py-2 active:bg-app-accent/25"
            onPress={onAddBlock}
          >
            <Text className="text-2xl font-light text-app-accent">+</Text>
            <Text className="text-xs font-semibold text-app-accent">Add block</Text>
          </Pressable>
        ) : (
          <View className="flex-1" />
        )}

        {SIDE_TABS.slice(1).map((tab) => (
          <NavItem
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onPress={() => onTabPress(tab.id)}
          />
        ))}
      </View>
    </View>
  );
}

function NavItem({ tab, isActive, onPress }) {
  const isDisabled = tab.disabled;
  return (
    <Pressable
      className={`flex-1 items-center rounded-xl py-2 ${
        isDisabled ? 'opacity-35' : isActive ? 'bg-app-accent/15' : 'active:bg-app-card'
      }`}
      onPress={() => {
        if (!isDisabled) onPress();
      }}
      disabled={isDisabled}
    >
      <Text className="text-xl">{tab.icon}</Text>
      <Text className={`mt-1 text-xs font-medium ${isActive ? 'text-app-accent' : 'text-app-muted'}`}>
        {tab.label}
      </Text>
    </Pressable>
  );
}
