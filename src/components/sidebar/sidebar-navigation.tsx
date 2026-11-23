// Ghost AI by Brendigo
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export const IS_APPLE_PLATFORM =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

export const NEW_CONVERSATION_SHORTCUT = IS_APPLE_PLATFORM ? '⌘N' : 'Ctrl+N'

export interface NavItem {
  id: string
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  isActive: boolean
}

interface SidebarNavigationProps {
  navItems: NavItem[]
  activeItem: NavItem
  onItemClick: (item: NavItem) => void
  user: { name: string; email: string; avatar: string }
}

export function SidebarNavigation({
  navItems,
  activeItem,
  onItemClick,
}: SidebarNavigationProps) {
  const renderItem = (item: NavItem) => (
    <SidebarMenuItem key={item.id}>
      <SidebarMenuButton
        tooltip={{
          children: item.title,
          hidden: false,
        }}
        onClick={() => onItemClick(item)}
        isActive={activeItem?.id === item.id}
        className="px-2.5 md:px-2"
      >
        <item.icon />
        <span>{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )

  return (
    <Sidebar collapsible="none" className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="px-1.5 md:px-0">
            <SidebarMenu>{navItems.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
