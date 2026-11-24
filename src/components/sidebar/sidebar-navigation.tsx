// Ghost AI by Brendigo
import appIcon from '@/assets/app-icon.png'
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
  showLabels?: boolean
}

export function SidebarNavigation({
  navItems,
  activeItem,
  onItemClick,
  showLabels = false,
}: SidebarNavigationProps) {
  const itemClass = showLabels
    ? 'h-11 rounded-xl px-3 data-[active=true]:text-primary'
    : 'px-2.5 md:px-2'
  const renderItem = (item: NavItem) => (
    <SidebarMenuItem key={item.id}>
      <SidebarMenuButton
        tooltip={{
          children: item.title,
          hidden: false,
        }}
        onClick={() => onItemClick(item)}
        isActive={activeItem?.id === item.id}
        aria-current={activeItem?.id === item.id ? 'page' : undefined}
        aria-label={item.title}
        className={itemClass}
      >
        <item.icon />
        <span className={showLabels ? undefined : 'sr-only'}>{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )

  return (
    <Sidebar
      collapsible="none"
      role="navigation"
      aria-label="Ghost AI"
      className={showLabels ? 'w-full! min-w-0 border-r border-sidebar-border' : 'w-[calc(var(--sidebar-width-icon)+1px)]! shrink-0 border-r'}
    >
      <div className={showLabels ? 'flex shrink-0 items-center gap-3 px-5 py-6' : 'flex shrink-0 justify-center py-3'}>
        <img src={appIcon} alt="" className={showLabels ? 'size-12 rounded-[14px]' : 'size-8 rounded-lg'} />
        {showLabels && (
          <div className="min-w-0">
            <p className="text-lg font-semibold leading-tight text-foreground">Ghost AI</p>
            <p className="text-xs text-muted-foreground">by Brendigo</p>
          </div>
        )}
      </div>
      <SidebarContent className="overflow-x-hidden">
        <SidebarGroup className={showLabels ? 'px-3' : undefined}>
          <SidebarGroupContent className={showLabels ? undefined : 'px-1.5 md:px-0'}>
            <SidebarMenu>
              {navItems.map(renderItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {showLabels && <p className="shrink-0 px-5 py-4 text-xs text-muted-foreground">Ghost AI · brendigo.com</p>}
    </Sidebar>
  )
}
