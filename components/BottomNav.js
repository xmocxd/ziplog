import { Pressable, Text, View } from 'react-native';

const SIDE_TABS = [
  { id: 'timelog', label: 'Log Time', icon: '⏱' },
  { id: 'planner', label: 'Trip Planner', icon: '🗺' },
  { id: 'calendar', label: 'Calendar', icon: '📅', disabled: true },
];

export default function BottomNav({ activeTab, onTabPress, onAddBlock, showAddBlock }) {
  return (
    <View className="border-t border-gray-200 bg-white px-2 pb-2 pt-2">
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
            className="mx-1 flex-1 items-center rounded-xl border border-blue-200 bg-blue-50 py-2 active:bg-blue-100"
            onPress={onAddBlock}
          >
            <Text className="text-2xl font-light text-blue-600">+</Text>
            <Text className="text-xs font-semibold text-blue-600">Add block</Text>
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
      className={`flex-1 items-center rounded-lg py-2 ${
        isDisabled ? 'opacity-40' : isActive ? 'bg-blue-50' : 'active:bg-gray-50'
      }`}
      onPress={() => {
        if (!isDisabled) onPress();
      }}
      disabled={isDisabled}
    >
      <Text className="text-xl">{tab.icon}</Text>
      <Text className={`mt-1 text-xs font-medium ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
        {tab.label}
      </Text>
    </Pressable>
  );
}
