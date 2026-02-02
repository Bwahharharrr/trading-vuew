// Grid rendering: canvas drawing, overlay management

export default class GridRenderer {
    constructor(grid) {
        this.grid = grid
        this.overlays = []
        this.crosshair = null
    }

    get ctx() { return this.grid.ctx }
    get layout() { return this.grid.layout }
    get $p() { return this.grid.$p }
    get data() { return this.grid.data }
    get range() { return this.grid.range }
    get interval() { return this.grid.interval }
    get cursor() { return this.grid.cursor }
    get id() { return this.grid.id }

    new_layer(layer) {
        if (layer.name === 'crosshair') {
            this.crosshair = layer
        } else {
            this.overlays.push(layer)
        }
        this.update()
    }

    del_layer(id) {
        this.overlays = this.overlays.filter(x => x.id !== id)
        this.update()
    }

    show_hide_layer(event) {
        let l = this.overlays.filter(x => x.id === event.id)
        if (l.length) l[0].display = event.display
    }

    update() {
        const comp = this.grid.comp
        const layout = comp.layoutOverride || this.$p.layout.grids[this.id]
        this.grid.layout = layout
        this.grid.interval = this.$p.interval

        if (!layout) return

        this.ctx.clearRect(0, 0, this.grid.canvas.width, this.grid.canvas.height)

        if (this.$p.shaders.length) this.apply_shaders()

        this.drawGrid()

        // Sort overlays by z-index and render
        let overlays = [...this.overlays]
        overlays.sort((l1, l2) => l1.z - l2.z)

        overlays.forEach(l => {
            if (!l.display) return
            this.ctx.save()
            let r = l.renderer
            if (r.pre_draw) r.pre_draw(this.ctx)
            r.draw(this.ctx)
            if (r.post_draw) r.post_draw(this.ctx)
            this.ctx.restore()
        })

        if (this.crosshair) {
            this.crosshair.renderer.draw(this.ctx)
        }
    }

    apply_shaders() {
        let layout = this.$p.layout.grids[this.id]
        let props = {
            layout: layout,
            range: this.range,
            interval: this.interval,
            tf: layout.ti_map.tf,
            cursor: this.cursor,
            colors: this.$p.colors,
            sub: this.data,
            font: this.$p.font,
            config: this.$p.config,
            meta: this.$p.meta
        }
        for (var s of this.$p.shaders) {
            this.ctx.save()
            s.draw(this.ctx, props)
            this.ctx.restore()
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = this.$p.colors.grid
        this.ctx.beginPath()

        const ymax = this.layout.height
        for (var [x, p] of this.layout.xs) {
            this.ctx.moveTo(x - 0.5, 0)
            this.ctx.lineTo(x - 0.5, ymax)
        }

        for (var [y, y$] of this.layout.ys) {
            this.ctx.moveTo(0, y - 0.5)
            this.ctx.lineTo(this.layout.width, y - 0.5)
        }

        this.ctx.stroke()

        if (this.$p.grid_id) this.drawUpperBorder()
    }

    drawUpperBorder() {
        this.ctx.strokeStyle = this.$p.colors.scale
        this.ctx.beginPath()
        this.ctx.moveTo(0, 0.5)
        this.ctx.lineTo(this.layout.width, 0.5)
        this.ctx.stroke()
    }

    // Propagate mouse event to overlays
    propagate(name, event) {
        for (var layer of this.overlays) {
            if (layer.renderer[name]) {
                layer.renderer[name](event)
            }
            const mouse = layer.renderer.mouse
            const keys = layer.renderer.keys
            if (mouse.listeners) {
                mouse.emit(name, event)
            }
            if (keys && keys.listeners) {
                keys.emit(name, event)
            }
        }
    }
}
