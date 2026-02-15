import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Server, Users, Activity, HardDrive } from 'lucide-react';

export default async function DashboardPage() {
  // TODO: Fetch real data
  const stats = {
    status: 'running',
    inbounds: 3,
    users: 10,
    connections: 42,
    traffic: { up: 1024 * 1024 * 512, down: 1024 * 1024 * 2048 },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <Badge variant={stats.status === 'running' ? 'success' : 'error'}>
          {stats.status === 'running' ? 'Running' : 'Stopped'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/20 rounded-lg">
            <Server className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-white/50 text-sm">Inbounds</p>
            <p className="text-2xl font-bold text-white">{stats.inbounds}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-green-500/20 rounded-lg">
            <Users className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <p className="text-white/50 text-sm">Users</p>
            <p className="text-2xl font-bold text-white">{stats.users}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-purple-500/20 rounded-lg">
            <Activity className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-white/50 text-sm">Connections</p>
            <p className="text-2xl font-bold text-white">{stats.connections}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-orange-500/20 rounded-lg">
            <HardDrive className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <p className="text-white/50 text-sm">Traffic</p>
            <p className="text-lg font-bold text-white">
              {(stats.traffic.up / 1024 / 1024).toFixed(0)}MB / {(stats.traffic.down / 1024 / 1024).toFixed(0)}MB
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors">
            Start Service
          </button>
          <button className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors">
            Restart Service
          </button>
          <button className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors">
            Stop Service
          </button>
        </div>
      </Card>
    </div>
  );
}
