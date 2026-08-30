"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AirVent,
  AlertTriangle,
  BellRing,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Gauge,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  Plus,
  RefreshCw,
  Wrench,
  Zap,
} from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";

type Equipment = {
  id: number;
  name: string;
  type: string;
  location: string;
  status: "Online" | "Service" | "Offline";
  healthScore: number;
  zoneTemp: number;
  supplyTemp: number;
  staticPressure: number;
  runtimeHours: number;
  energyKw: number;
  lastService: string | null;
};

type WorkOrder = {
  id: number;
  code: string;
  equipmentName: string;
  title: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "In Progress" | "Completed";
  assignee: string | null;
  dueDate: string | null;
  notes: string;
  createdAt: string;
};

type Alarm = {
  id: number;
  code: string;
  equipmentName: string;
  severity: "Warning" | "High" | "Critical";
  message: string;
  status: "Active" | "Acknowledged";
  createdAt: string;
};

type Reading = {
  time: string;
  zoneTemp: number;
  supplyTemp: number;
  demand: number;
};

type DashboardData = {
  summary: {
    totalAssets: number;
    onlineAssets: number;
    avgHealth: number;
    totalEnergy: number;
    activeAlarms: number;
  };
  equipment: Equipment[];
  workOrders: WorkOrder[];
  alarms: Alarm[];
  readings: Reading[];
  updatedAt: string;
};

const chartConfig = {
  zoneTemp: { label: "Zone temperature", color: "#e8751a" },
  supplyTemp: { label: "Supply air", color: "#8b8177" },
} satisfies ChartConfig;

const navItems = [
  { label: "Overview", href: "#overview", icon: LayoutDashboard },
  { label: "Equipment", href: "#equipment", icon: AirVent },
  { label: "Work orders", href: "#work-orders", icon: ClipboardList },
  { label: "Active alarms", href: "#alarms", icon: BellRing },
];

function statusClass(value: string) {
  return `status-pill status-${value.toLowerCase().replaceAll(" ", "-")}`;
}

function formatDueDate(value: string | null) {
  if (!value) return "No due date";
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function DashboardSkeleton() {
  return (
    <div className="dashboard-content" aria-label="Loading dashboard">
      <div className="kpi-grid">
        {[0, 1, 2, 3].map((item) => (
          <Skeleton className="h-[142px] rounded-none bg-[#e8e2da]" key={item} />
        ))}
      </div>
      <div className="primary-grid">
        <Skeleton className="h-[390px] rounded-none bg-[#e8e2da]" />
        <Skeleton className="h-[390px] rounded-none bg-[#e8e2da]" />
      </div>
      <Skeleton className="h-[410px] rounded-none bg-[#e8e2da]" />
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [equipmentId, setEquipmentId] = useState("");
  const [priority, setPriority] = useState("Medium");

  const loadDashboard = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      const payload = (await response.json()) as DashboardData & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to load dashboard data.");
      setData(payload);
      setEquipmentId((current) => current || String(payload.equipment[0]?.id ?? ""));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const mutate = useCallback(
    async (payload: Record<string, unknown>, successMessage: string) => {
      setSaving(true);
      try {
        const response = await fetch("/api/dashboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(result.error ?? "The update could not be saved.");
        await loadDashboard(true);
        toast.success(successMessage);
        return true;
      } catch (mutationError) {
        toast.error(
          mutationError instanceof Error ? mutationError.message : "The update could not be saved.",
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    [loadDashboard],
  );

  const handleNewWorkOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const saved = await mutate(
      {
        action: "create_work_order",
        title: form.get("title"),
        equipmentId,
        priority,
        dueDate: form.get("dueDate"),
        notes: form.get("notes"),
      },
      "Work order created",
    );

    if (saved) {
      formElement.reset();
      setPriority("Medium");
      setDialogOpen(false);
    }
  };

  const activeAlarms = useMemo(
    () => data?.alarms.filter((alarm) => alarm.status === "Active") ?? [],
    [data],
  );

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <main className="dashboard-app">
        <header className="main-navbar">
          <div className="navbar-inner">
            <a className="dashboard-brand" href="#overview" aria-label="AJ Climate Controls dashboard">
              <span>AJ</span>
              <div><strong>AJ Climate</strong><small>Operations Dashboard</small></div>
            </a>

            <nav className="desktop-navbar" aria-label="Dashboard navigation">
              {navItems.map(({ label, href }, index) => (
                <a className={index === 0 ? "active" : ""} href={href} key={label}>{label}</a>
              ))}
            </nav>

            <div className="navbar-actions">
              <span className="sync-label"><span className="live-dot" /> Live database</span>
              <Button
                variant="outline"
                size="icon"
                className="refresh-button"
                onClick={() => void loadDashboard(true)}
                disabled={refreshing}
                aria-label="Refresh dashboard"
              >
                <RefreshCw className={refreshing ? "animate-spin" : ""} />
              </Button>
              <DialogTrigger asChild>
                <Button className="orange-button desktop-work-button"><Plus /> New work order</Button>
              </DialogTrigger>

              <Sheet>
                <SheetTrigger asChild>
                  <Button className="mobile-menu-button" variant="outline" size="icon" aria-label="Open navigation menu">
                    <Menu />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="mobile-menu-panel">
                  <SheetHeader className="mobile-menu-header">
                    <SheetTitle>AJ Climate Controls</SheetTitle>
                    <SheetDescription>HVAC operations navigation</SheetDescription>
                  </SheetHeader>
                  <nav className="mobile-navbar" aria-label="Mobile dashboard navigation">
                    {navItems.map(({ label, href, icon: Icon }) => (
                      <SheetClose asChild key={label}>
                        <a href={href}><Icon /><span>{label}</span></a>
                      </SheetClose>
                    ))}
                  </nav>
                  <div className="mobile-menu-status">
                    <span className="live-dot" />
                    <div><strong>Database connected</strong><small>Persistent D1 storage</small></div>
                  </div>
                  <SheetClose asChild>
                    <Button className="orange-button mobile-work-button" onClick={() => setDialogOpen(true)}>
                      <Plus /> New work order
                    </Button>
                  </SheetClose>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        <DialogContent className="work-order-dialog">
          <form onSubmit={handleNewWorkOrder}>
            <DialogHeader>
              <DialogTitle>Create work order</DialogTitle>
              <DialogDescription>Add a maintenance task to the operations database.</DialogDescription>
            </DialogHeader>
            <div className="dialog-form-grid">
              <label className="full-field">
                <span>Work description</span>
                <Input name="title" placeholder="Example: Inspect supply fan VFD" required maxLength={120} />
              </label>
              <label>
                <span>Equipment</span>
                <Select value={equipmentId} onValueChange={setEquipmentId} required>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select equipment" /></SelectTrigger>
                  <SelectContent>
                    {data?.equipment.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label>
                <span>Priority</span>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Low', 'Medium', 'High', 'Critical'].map((item) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="full-field">
                <span>Due date</span>
                <Input name="dueDate" type="date" />
              </label>
              <label className="full-field">
                <span>Notes</span>
                <Textarea name="notes" placeholder="Add troubleshooting details or parts required…" />
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button className="orange-button" type="submit" disabled={saving || !equipmentId}>
                {saving && <LoaderCircle className="animate-spin" />} Save work order
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>

        {loading ? (
          <DashboardSkeleton />
        ) : error ? (
          <div className="dashboard-error">
            <AlertTriangle />
            <h1>Dashboard data is unavailable</h1>
            <p>{error}</p>
            <Button className="orange-button" onClick={() => void loadDashboard()}>Try again</Button>
          </div>
        ) : data ? (
          <div className="dashboard-content" id="overview">
            <div className="page-heading">
              <div>
                <span className="page-eyebrow">Operations overview</span>
                <h1>Good afternoon, AJ.</h1>
                <p>Monitor equipment health, resolve alarms, and manage service work from one place.</p>
              </div>
              <div className="last-updated">
                <Activity />
                <span>Last synchronized<strong>{new Date(data.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</strong></span>
              </div>
            </div>

            <section className="kpi-grid" aria-label="System summary">
              <article className="kpi-card">
                <div className="kpi-icon"><Building2 /></div>
                <div className="kpi-label"><span>Total equipment</span><strong>{data.summary.totalAssets}</strong></div>
                <small>{data.summary.onlineAssets} currently online</small>
              </article>
              <article className="kpi-card">
                <div className="kpi-icon green"><Gauge /></div>
                <div className="kpi-label"><span>Average health</span><strong>{data.summary.avgHealth}<em>%</em></strong></div>
                <small>Across all connected assets</small>
              </article>
              <article className="kpi-card">
                <div className="kpi-icon red"><BellRing /></div>
                <div className="kpi-label"><span>Active alarms</span><strong>{data.summary.activeAlarms}</strong></div>
                <small>{activeAlarms.filter((alarm) => alarm.severity === "Critical").length} critical condition</small>
              </article>
              <article className="kpi-card">
                <div className="kpi-icon amber"><Zap /></div>
                <div className="kpi-label"><span>Current demand</span><strong>{data.summary.totalEnergy}<em> kW</em></strong></div>
                <small>Combined equipment load</small>
              </article>
            </section>

            <div className="primary-grid">
              <section className="dashboard-card performance-card">
                <div className="card-heading">
                  <div><span>Performance trend</span><h2>RTU-12 temperature</h2></div>
                  <div className="chart-legend"><span className="zone" /> Zone temp <span className="supply" /> Supply air</div>
                </div>
                <ChartContainer config={chartConfig} className="performance-chart" initialDimension={{ width: 700, height: 280 }}>
                  <LineChart data={data.readings} margin={{ top: 14, right: 12, left: -18, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="4 4" />
                    <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={12} />
                    <YAxis domain={[50, 82]} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}°`} />
                    <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                    <Line type="monotone" dataKey="zoneTemp" stroke="var(--color-zoneTemp)" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="supplyTemp" stroke="var(--color-supplyTemp)" strokeWidth={2.2} dot={false} />
                  </LineChart>
                </ChartContainer>
              </section>

              <section className="dashboard-card alarm-card" id="alarms">
                <div className="card-heading">
                  <div><span>Needs attention</span><h2>Active alarms</h2></div>
                  <strong className="record-count">{activeAlarms.length}</strong>
                </div>
                <div className="alarm-list">
                  {activeAlarms.length ? activeAlarms.map((alarm) => (
                    <article className="alarm-item" key={alarm.id}>
                      <div className={`severity-marker severity-${alarm.severity.toLowerCase()}`}><AlertTriangle /></div>
                      <div className="alarm-copy">
                        <div><strong>{alarm.equipmentName}</strong><span className={statusClass(alarm.severity)}>{alarm.severity}</span></div>
                        <p>{alarm.message}</p>
                        <small>{alarm.code} · Active</small>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ack-button"
                        disabled={saving}
                        onClick={() => void mutate({ action: "acknowledge_alarm", id: alarm.id }, `${alarm.code} acknowledged`)}
                      >
                        Acknowledge
                      </Button>
                    </article>
                  )) : (
                    <Empty className="compact-empty">
                      <EmptyHeader>
                        <EmptyMedia variant="icon"><CheckCircle2 /></EmptyMedia>
                        <EmptyTitle>No active alarms</EmptyTitle>
                        <EmptyDescription>Every monitored condition is currently normal.</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  )}
                </div>
              </section>
            </div>

            <section className="dashboard-card table-card" id="equipment">
              <div className="card-heading table-heading">
                <div><span>Asset registry</span><h2>Equipment status</h2></div>
                <strong className="record-count">{data.equipment.length} assets</strong>
              </div>
              {data.equipment.length ? (
                <Table className="operations-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Health</TableHead>
                      <TableHead>Zone / Supply</TableHead>
                      <TableHead>Static</TableHead>
                      <TableHead>Load</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.equipment.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="equipment-name"><span><AirVent /></span><div><strong>{item.name}</strong><small>{item.type}</small></div></div>
                        </TableCell>
                        <TableCell>{item.location}</TableCell>
                        <TableCell>
                          <Select
                            value={item.status}
                            disabled={saving}
                            onValueChange={(status) => void mutate({ action: "update_equipment_status", id: item.id, status }, `${item.name} status updated`)}
                          >
                            <SelectTrigger className={`status-select ${statusClass(item.status)}`}><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Online">Online</SelectItem>
                              <SelectItem value="Service">Service</SelectItem>
                              <SelectItem value="Offline">Offline</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell><div className="health-cell"><span><i style={{ width: `${item.healthScore}%` }} /></span><strong>{item.healthScore}%</strong></div></TableCell>
                        <TableCell><div className="temperature-cell"><strong>{item.zoneTemp}°</strong><span>/</span><strong>{item.supplyTemp}°F</strong></div></TableCell>
                        <TableCell>{item.staticPressure} in.</TableCell>
                        <TableCell><strong>{item.energyKw} kW</strong></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Empty><EmptyHeader><EmptyMedia variant="icon"><AirVent /></EmptyMedia><EmptyTitle>No equipment found</EmptyTitle><EmptyDescription>Add equipment records to begin monitoring.</EmptyDescription></EmptyHeader></Empty>
              )}
            </section>

            <section className="dashboard-card table-card" id="work-orders">
              <div className="card-heading table-heading">
                <div><span>Maintenance workflow</span><h2>Work orders</h2></div>
                <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}><Plus /> Add work order</Button>
              </div>
              {data.workOrders.length ? (
                <Table className="operations-table work-order-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Work description</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Due date</TableHead>
                      <TableHead>Assigned</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.workOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell><strong className="order-code">{order.code}</strong></TableCell>
                        <TableCell><strong>{order.equipmentName}</strong></TableCell>
                        <TableCell><span className="work-title">{order.title}</span></TableCell>
                        <TableCell><span className={statusClass(order.priority)}>{order.priority}</span></TableCell>
                        <TableCell><span className="due-date"><CalendarDays />{formatDueDate(order.dueDate)}</span></TableCell>
                        <TableCell>{order.assignee ?? "Unassigned"}</TableCell>
                        <TableCell>
                          <Select
                            value={order.status}
                            disabled={saving}
                            onValueChange={(status) => void mutate({ action: "update_work_order", id: order.id, status }, `${order.code} updated`)}
                          >
                            <SelectTrigger className={`status-select ${statusClass(order.status)}`}><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Open">Open</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Empty><EmptyHeader><EmptyMedia variant="icon"><Wrench /></EmptyMedia><EmptyTitle>No work orders</EmptyTitle><EmptyDescription>Create the first maintenance task for your team.</EmptyDescription></EmptyHeader></Empty>
              )}
            </section>

            <footer className="dashboard-footer">
              <span>AJ Climate Controls · Operations Database</span>
              <span><span className="live-dot" /> Persistent data synchronized</span>
            </footer>
          </div>
        ) : null}
        <Toaster position="bottom-right" richColors />
      </main>
    </Dialog>
  );
}
